package cz.incad.nkp.rdcz;

import cz.incad.FormatUtils;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
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

  private Options opts;
  private JSONObject jobData;
  SolrClient solr;
  int indexed;
  int errors;

  public Indexer() {
    try {
      opts = Options.getInstance();
      jobData = new JSONObject();
      solr = getClient();
      indexed = 0;
      errors = 0;
    } catch (IOException ex) {
      Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
    } catch (JSONException ex) {
      Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
    }
  }

  private SolrClient getClient() throws IOException {
    SolrClient client = new HttpSolrClient.Builder(
            opts.getString("solr.host", "http://localhost:8983/solr")).build();
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
    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String sql = opts.getString("update_query").replace("#fields#", fields);
    String lastIndexTime = readIndexTime();
    if (lastIndexTime == null) {
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
      lastIndexTime = sdf.format(new Date());
    }
    sql = sql.replaceAll("#from#", lastIndexTime);
    getFromDb(sql);

    ret.put("success indexed reliefu", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    return ret;
  }

  public JSONObject predlohy() throws IOException {
    LOGGER.log(Level.INFO, "Full index started ");
    Date start = new Date();
    JSONObject ret = new JSONObject();
    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String sql = opts.getString("sqlFull").replace("#fields#", fields);
    getFromDb(sql);
    LOGGER.log(Level.INFO, "{0} docs processed", indexed);

    ret.put("SUCCESS indexed reliefu", indexed);
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
    indexLists();
    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String sql = opts.getString("sqlFull").replace("#fields#", fields);

    //sql += " and rownum < 10";
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
              + "rdcz/select?wt=json&q=*:*&rows=1&sort=index_time+desc&fl=index_time";
      inputStream = RESTHelper.inputStream(url);
      jsResp = new JSONObject(org.apache.commons.io.IOUtils.toString(inputStream, Charset.forName("UTF-8")));

      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
      SimpleDateFormat solrDate = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      String index_time = jsResp.getJSONObject("response").getJSONArray("docs").getJSONObject(0).getString("index_time");
      last = sdf.format(solrDate.parse(index_time));

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

  private String lastDigObjectDate() {
    String last = null;
    InputStream inputStream = null;
    JSONObject jsResp;
    try {
      String url = opts.getString("solrhost", "http://localhost:8983/solr/")
              + "digobjekt/select?wt=json&q=*:*&rows=1&sort=index_time+desc&fl=index_time";
      inputStream = RESTHelper.inputStream(url);
      jsResp = new JSONObject(org.apache.commons.io.IOUtils.toString(inputStream, Charset.forName("UTF-8")));

      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
      SimpleDateFormat solrDate = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      String index_time = jsResp.getJSONObject("response").getJSONArray("docs").getJSONObject(0).getString("index_time");
      last = sdf.format(solrDate.parse(index_time));

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

  public void indexLists() {
    String sql = "select * from dlists";
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
            SolrInputDocument idoc = indexRow(rs);

            idocs.add(idoc);

            if (idocs.size() >= batchSize) {
              solr.add("lists", idocs);
              solr.commit("lists");

              indexed += idocs.size();
              LOGGER.log(Level.INFO, "{0} docs processed ", indexed);
              idocs.clear();
            }
          }
          rs.close();
          ps.close();
          if (!idocs.isEmpty()) {
            solr.add("lists", idocs);
            solr.commit("lists");
            indexed += idocs.size();
            idocs.clear();
          }
        } catch (SolrServerException ex) {
          LOGGER.log(Level.SEVERE, sql);
          LOGGER.log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
        }
        conn.close();
      }
    } catch (NamingException | SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  public JSONObject indexDigObject(boolean update) {
    JSONObject ret = new JSONObject();
    String sql = "select digobjekt.*, dk.nazev, dk.URLDIGKNIHOVNY, "
            + "nvl(predloha.ccnb, -predloha.id) as cnb_collaps, "
            + "nvl(predloha.ISSN, nvl(predloha.ISBN, -predloha.id)) as isxn_collaps, "
            + "nvl(predloha.SIGLA1, -predloha.id) || nvl(predloha.SYSNO, -predloha.id) as aba_collaps "
            + " from predloha, digobjekt, digknihovna dk"
            + " where digobjekt.rpredloha_digobjekt=predloha.id and dk.id=digobjekt.rdigknihovna_digobjekt";
    if (update) {
      String lastIndexTime = lastDigObjectDate();
      if (lastIndexTime != null) {
        sql += " and edidate>=" + lastIndexTime;
      }
    }
    LOGGER.log(Level.INFO, "Processing {0}", sql);
    try {
      Context initContext = new InitialContext();
      Context envContext = (Context) initContext.lookup("java:/comp/env");
      DataSource ds = (DataSource) envContext.lookup("jdbc/rlf");
      try (Connection conn = ds.getConnection()) {
        PreparedStatement ps = conn.prepareStatement(sql);
        int batchSize = 500;
        ArrayList<SolrInputDocument> idocs = new ArrayList<>();

        try (ResultSet rs = ps.executeQuery()) {
          while (rs.next()) {
            SolrInputDocument idoc = indexRow(rs);

            idocs.add(idoc);

            if (idocs.size() >= batchSize) {
              solr.add("digobjekt", idocs);
              solr.commit("digobjekt");

              indexed += idocs.size();
              LOGGER.log(Level.INFO, "{0} docs processed ", indexed);
              idocs.clear();
            }
          }
          rs.close();
          ps.close();
          if (!idocs.isEmpty()) {
            solr.add("lists", idocs);
            solr.commit("lists");
            indexed += idocs.size();
            idocs.clear();
          }

          LOGGER.log(Level.INFO, "Index DigObjekt finished. {0} docs processed ", indexed);
          ret.put("msg", indexed + " docs processed");
        } catch (SolrServerException ex) {
          LOGGER.log(Level.SEVERE, sql);
          LOGGER.log(Level.SEVERE, null, ex);
          ret.put("error", ex.toString());
        } catch (IOException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
          ret.put("error", ex.toString());
        }
        conn.close();
      }
    } catch (NamingException | SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      ret.put("error", ex.toString());
    }
    return ret;
  }

  private void getFromDb(String sql) {
    LOGGER.log(Level.INFO, "Processing {0}", sql);
    try {
      Context initContext = new InitialContext();
      Context envContext = (Context) initContext.lookup("java:/comp/env");
      DataSource ds = (DataSource) envContext.lookup("jdbc/rlf");
      try (Connection conn = ds.getConnection()) {
        PreparedStatement ps = conn.prepareStatement(sql);
        int batchSize = 500;

        ArrayList<SolrInputDocument> idocs = new ArrayList<>();

        try (ResultSet rs = ps.executeQuery()) {
          while (rs.next()) {
            SolrInputDocument idoc = indexRow(rs);
            addNeplatneCnb(idoc, rs.getString("id"), conn);
            addDigKnihovny(idoc, rs, conn);
            if (rs.getString("katalog") != null) {
              addKatalogUrl(idoc, rs.getString("katalog"), rs.getString("pole001"), conn);
            }
            addVarNazev(idoc, rs.getString("id"), conn);
            int rokvyd = -1;
            try {
              rokvyd = rs.getInt("rokvydstr");
              idoc.addField("rokvyd", rokvyd);
            } catch (SQLException e) {
              LOGGER.log(Level.FINE, "rokvyd not number");
            }
            idocs.add(idoc);

            if (idocs.size() >= batchSize) {
              solr.add("rdcz", idocs);
              solr.commit("rdcz");

              indexed += idocs.size();
              LOGGER.log(Level.INFO, "{0} docs processed ", indexed);
              idocs.clear();
            }
          }
          rs.close();
          ps.close();
          if (!idocs.isEmpty()) {
            solr.add("rdcz", idocs);
            solr.commit("rdcz");
            indexed += idocs.size();
            idocs.clear();
          }
        } catch (SolrServerException ex) {
          LOGGER.log(Level.SEVERE, sql);
          LOGGER.log(Level.SEVERE, null, ex);
        } catch (IOException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
        }
        conn.close();
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

  private void addNeplatneCnb(SolrInputDocument idoc, String predlohaid, Connection conn) {
    try {
      String sql = "select value from digknihovna, predloha, dlists "
              + "where predloha.digKnihovna=dlists.value "
              + "and dlists.id=digknihovna.id and predloha.id=" + predlohaid;
      PreparedStatement ps = conn.prepareStatement(sql);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          idoc.addField("ccnb", rs.getString("value"));
        }
        rs.close();
      }
      ps.close();
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private void addDigKnihovny(SolrInputDocument idoc, ResultSet rs, Connection conn) {

    String f = "";
//    List<String> uris = new ArrayList<>();
    try {
      if (rs.getString("url") != null) {
        URI uri = new URI(rs.getString("url").trim());
        f += " urldigknihovny like '" + uri.getScheme() + "://" + uri.getHost() + "%'";
//        uris.add(uri.getScheme() + "://" + uri.getHost());
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, null, ex);
    }

    try {
      if (rs.getString("urltitul") != null) {
        URI uri = new URI(rs.getString("urltitul").trim());
        if (!"".equals(f)) {
          f += " OR ";
        }
        f += " urldigknihovny like '" + uri.getScheme() + "://" + uri.getHost() + "%'";
//        uris.add(uri.getScheme() + "://" + uri.getHost());
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, null, ex);
    }

    try {
      if (rs.getString("urltitnk") != null) {
        URI uri = new URI(rs.getString("urltitnk").trim());
        if (!"".equals(f)) {
          f += " OR ";
        }
        f += " urldigknihovny like '" + uri.getScheme() + "://" + uri.getHost() + "%'";
//        uris.add(uri.getScheme() + "://" + uri.getHost());
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, null, ex);
    }

    if ("".equals(f)) {
      return;
    }

    try {
      f = " where " + f;
      String sql = "select distinct(nazev) from digknihovna" + f;

      //LOGGER.log(Level.INFO, sql);
//      boolean isEmpty = true;
      
      PreparedStatement ps = conn.prepareStatement(sql);
      try (ResultSet rsdk = ps.executeQuery()) {
        while (rsdk.next()) {
          idoc.addField("digknihovna", rsdk.getString("nazev"));
//          isEmpty = false;
        }
        rsdk.close();
      }
      ps.close();
      
//      if (isEmpty) {
//        for (String u : uris) {
//          idoc.addField("digknihovna", u);
//        }
//      }
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private void addDigKnihovnyOld(SolrInputDocument idoc, String predlohaid, Connection conn) {
    try {
      String sql = "select digknihovna.nazev as digk from digknihovna, predloha, dlists \n"
              + "                            where predloha.digKnihovna=dlists.value \n"
              + "                            and dlists.id=digknihovna.id and predloha.id=" + predlohaid;
      PreparedStatement ps = conn.prepareStatement(sql);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          idoc.addField("digknihovna", rs.getString("digk"));
        }
        rs.close();
      }
      ps.close();
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private void addKatalogUrl(SolrInputDocument idoc, String katalog, String pole001, Connection conn) {
    try {
      String sql = "select * from katalog where katalog.VALUE=?";
      PreparedStatement ps = conn.prepareStatement(sql);
      ps.setString(1, katalog);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          String url = "http://" + rs.getString("link001prefix") + pole001;
          if (rs.getString("link001sufix") != null) {
            url += rs.getString("link001sufix");
          }
          idoc.addField("bibliographich_data", url);
        }
        rs.close();
      }
      ps.close();
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private void addVarNazev(SolrInputDocument idoc, String predlohaid, Connection conn) {
    try {
      String sql = "select VARNAZEV from TABVARNAZEV where RPREDLOHA_TVN=" + predlohaid;
      PreparedStatement ps = conn.prepareStatement(sql);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          idoc.addField("varnazev", rs.getString("VARNAZEV"));
        }
        rs.close();
      }
      ps.close();

    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

}
