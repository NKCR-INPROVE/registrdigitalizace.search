package cz.incad.nkp.rdcz;


import cz.incad.FormatUtils;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.common.SolrInputDocument;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class Indexer {
  
  static final Logger LOGGER = Logger.getLogger(Indexer.class.getName());
  final String sqlFull = "select %s from predloha where predloha.stavRec <> 'smazat' and predloha.stavRec <> 'interni'";
  
  
  final String  delete_query = "select recordid \n" +
"                        from recordgraveyard \n" +
"                        where (recordgraveyard.agenda='cz.incad.rd.Predloha')\n" +
"                        and recordgraveyard.datum>=to_date('#from#', 'yyyy-MM-dd')";
  
  final String  delete_query_stav = "select id from predloha where stavRec='smazat'";
  
  final String  update_query = "select #fields# from predloha \n" +
"                        where (predloha.zaldate>=to_date('#from#', 'yyyy-MM-dd') or predloha.edidate>=to_date('#from#', 'yyyy-MM-dd'))\n" +
"                        and stavRec <> 'smazat' and predloha.stavRec &lt;&gt; 'interni'";
                        
  
  final String  update_query_ukoly = "select #fields# from predloha, record, zakazka, ukol \n" +
"                        where ukol.rzakazkauk=zakazka.id and predloha.id=record.id\n" +
"                        and (record.zaldate>=to_date('#from#', 'yyyy-MM-dd') or record.edidate>=to_date('#from#', 'yyyy-MM-dd')) \n" +
"                        and zakazka.rtitnkpza=predloha.id\n" +
"                        and predloha.stavRec <> 'smazat' and predloha.stavRec <> 'interni'";
                        
                        

  private Options opts;
  private JSONObject jobData;
  SolrClient solr;
  int indexed;
  int errors;
  
  

  public Indexer() {
    try {
      opts = Options.getInstance();
      jobData = new JSONObject();
      solr = getClient("rdcz/");
      indexed = 0;
      errors = 0;
    } catch (IOException ex) {
      Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
    } catch (JSONException ex) {
      Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
    }
  }
  

  private SolrClient getClient(String core) throws IOException {
    SolrClient client = new HttpSolrClient.Builder(String.format("%s/%s",
            opts.getString("solr.host", "http://localhost:8983"),
            core)).build();
    return client;
  }
  
  

  public JSONObject run(JSONObject jobData) throws IOException {
    this.jobData = jobData;
    if (this.jobData.optBoolean("full")) {
      return full();
    } else {
      return update();
    }
  }
  
  public JSONObject update() throws IOException {
    LOGGER.log(Level.INFO, "Update index started ");
    Date start = new Date();
    JSONObject ret = new JSONObject();
    String sql = sqlFull;
    String lastIndexTime = readIndexTime();
    if (lastIndexTime != null) {
      sql += " and spis.EDI_TIMESTAMP >= to_timestamp('" + lastIndexTime + "', 'YYYY-MM-DD\"T\"HH24:MI:SS.ff\"Z\"')";
    }
    getFromDb(sql);
    
    ret.put("success indexed reliefu", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    return ret;
  }

  public JSONObject full() throws IOException {
    LOGGER.log(Level.INFO, "Full index started ");
    Date start = new Date();
    JSONObject ret = new JSONObject();
    String sql = String.format(sqlFull, 
        opts.getString("db.fields"));
    getFromDb(sql);
    LOGGER.log(Level.INFO, "{0} docs processed", indexed);
    
    ret.put("SUCCESS indexed reliefu", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    return ret;
  }

  private String readIndexTime() {
    String last = null;
    InputStream inputStream = null;
    JSONObject jsResp;
    try {
      String url = opts.getString("solrhost", "http://localhost:8983/solr/")
              + "import/select?wt=json&q=*:*&rows=1&sort=index_time+desc&fl=index_time&fq=system:\"IS+CSMS\"";
      inputStream = RESTHelper.inputStream(url);
      jsResp = new JSONObject(org.apache.commons.io.IOUtils.toString(inputStream, Charset.forName("UTF-8")));
      last = jsResp.getJSONObject("response").getJSONArray("docs").getJSONObject(0).getString("index_time");
    } catch (Exception ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    } finally {
      try {
        inputStream.close();
      } catch (IOException ex) {
        LOGGER.log(Level.SEVERE, null, ex);
      }
    }
    LOGGER.log(Level.INFO, "last indexed doc time is {0}", last);
    return last;
  }

  private void getFromDb(String sql) {
    LOGGER.log(Level.INFO, "Processing {0}", sql);
    try {
      Context initContext = new InitialContext();
      Context envContext = (Context) initContext.lookup("java:/comp/env");
      DataSource ds = (DataSource) envContext.lookup("jdbc/rlf");
      try (Connection conn = ds.getConnection()) {
        PreparedStatement ps = conn.prepareStatement(sql);
        int batchSize = 100;
        ArrayList<SolrInputDocument> idocs = new ArrayList<>();
        
        try (ResultSet rs = ps.executeQuery()) {
          while (rs.next()) {
            idocs.add(indexRow(rs));
            
            if (idocs.size() >= batchSize) {
              solr.add(idocs);
              solr.commit();
              
              indexed += idocs.size();
              LOGGER.log(Level.INFO, "{0} docs processed ", indexed);
              idocs.clear();
            }
          }
          if(!idocs.isEmpty()){
            solr.add(idocs);
            solr.commit();
            indexed += idocs.size();
            idocs.clear();
          }
        } catch (SolrServerException ex) {
          LOGGER.log(Level.SEVERE, sql);
          LOGGER.log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
        }
      }
    } catch (NamingException | SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private SolrInputDocument indexRow(ResultSet rs) throws SolrServerException, IOException, SQLException {

    SolrInputDocument idoc = new SolrInputDocument();
    ResultSetMetaData meta = rs.getMetaData();
    final int columnCount = meta.getColumnCount();

    for (int column = 1; column <= columnCount; column++) {
      Object value = rs.getObject(column);
      if (value instanceof java.math.BigDecimal) {
        idoc.addField(meta.getColumnName(column).toLowerCase(), value.toString());
      } else {
        idoc.addField(meta.getColumnName(column).toLowerCase(), value);
      }
    }

    return idoc;
  }
  
}
