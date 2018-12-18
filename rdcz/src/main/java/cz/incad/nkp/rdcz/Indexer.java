package cz.incad.nkp.rdcz;

import cz.incad.FormatUtils;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import org.apache.commons.io.Charsets;
import org.apache.commons.io.IOUtils;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrInputDocument;
import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

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
  int deleted;
  int errors;

  //Stores map urldigknihovny scheme to nazev
  Map<String, String> digKnihovnyCached = new HashMap<>();

  public Indexer() {
    try {
      opts = Options.getInstance();
      jobData = new JSONObject();

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
      return full(true);
    } else {
      return update();
    }
  }

  private void deleteAll(Date start) {
    try {
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
      String q = "index_time:[* T0 " + sdf.format(start) + "]";
      solr.deleteByQuery("rdcz", q);
      solr.commit("rdcz");
      LOGGER.log(Level.INFO, "Core rdcz deleted!! ");

      solr.deleteByQuery("lists", q);
      solr.commit("lists");
      LOGGER.log(Level.INFO, "Core lists deleted!! ");

      solr.deleteByQuery("digknihovny", q);
      solr.commit("digknihovny");
      LOGGER.log(Level.INFO, "Core digknihovny deleted!! ");

      solr.deleteByQuery("digobjekt", q);
      solr.commit("digobjekt");
      LOGGER.log(Level.INFO, "Core digobjekt deleted!! ");
    } catch (SolrServerException ex) {
      Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
    } catch (IOException ex) {
      Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
    }

  }

  private JSONObject remove() {
    LOGGER.log(Level.INFO, "Remove from index started ");
    Date start = new Date();
    JSONObject ret = new JSONObject();
    String sql = opts.getString("delete_query");
    String lastIndexTime = readIndexTime();
    if (lastIndexTime == null) {
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
      lastIndexTime = sdf.format(new Date());
    }
    sql = sql.replaceAll("#from#", lastIndexTime);

    try {
      Context initContext = new InitialContext();
      Context envContext = (Context) initContext.lookup("java:/comp/env");
      DataSource ds = (DataSource) envContext.lookup("jdbc/rlf");
      try (Connection conn = ds.getConnection()) {
        PreparedStatement ps = conn.prepareStatement(sql);
        int batchSize = 500;

        ArrayList<String> idocs = new ArrayList<>();

        try (ResultSet rs = ps.executeQuery()) {
          while (rs.next()) {
            idocs.add(rs.getString("recordid"));

            if (idocs.size() >= batchSize) {
              solr.deleteById("rdcz", idocs);
              solr.commit("rdcz");

              deleted += idocs.size();
              LOGGER.log(Level.INFO, "{0} docs processed ", deleted);
              idocs.clear();
            }
          }
          if (!idocs.isEmpty()) {
            solr.deleteById("rdcz", idocs);
            solr.commit("rdcz");

            deleted += idocs.size();
            LOGGER.log(Level.INFO, "{0} docs processed ", deleted);
            idocs.clear();
          }
        } catch (SolrServerException | IOException ex) {
          Logger.getLogger(Indexer.class.getName()).log(Level.SEVERE, null, ex);
        }
      }
      ret.put("success removed from graveyard", deleted);
    } catch (NamingException | SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    return ret;
  }

  public JSONObject update() throws IOException {
    LOGGER.log(Level.INFO, "Update index started ");

    solr = getClient();
    Date start = new Date();
    JSONObject ret = new JSONObject();

    indexLists();
    ret.put("Index DigKnihovny", indexDigKnihovny(false));
    ret.put("Index DigObjekt", indexDigObject(true));

    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String lastIndexTime = readIndexTime();
    String sql = opts.getString("update_query").replace("#fields#", fields);
    if (lastIndexTime == null) {
//      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
//      lastIndexTime = sdf.format(new Date());
      sql = opts.getString("sqlFull").replace("#fields#", fields);
    } else {
      sql = sql.replaceAll("#from#", lastIndexTime);
    }

    indexPredlohy(sql);
    remove();

    ret.put("success indexed reliefu", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs indexed, {1} docs removed in {2} ", new Object[]{indexed, deleted, ellapsed});
    solr.close();
    return ret;
  }

  public JSONObject predlohy() throws IOException {
    LOGGER.log(Level.INFO, "Indexing predlohy started ");

    solr = getClient();
    Date start = new Date();
    JSONObject ret = new JSONObject();
    fillDigKnihovnyCache();
    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String sql = opts.getString("sqlFull").replace("#fields#", fields);
    indexPredlohy(sql);
    LOGGER.log(Level.INFO, "{0} docs processed", indexed);

    ret.put("SUCCESS indexed reliefu", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    solr.close();
    return ret;
  }

  public JSONObject full(boolean clean) throws IOException {
    LOGGER.log(Level.INFO, "Full index started ");

    solr = getClient();
    Date start = new Date();
    JSONObject ret = new JSONObject();
    boolean noErrors = true;
    noErrors = noErrors && indexLists();
    noErrors = noErrors && !indexDigKnihovny(false).has("error");

    ret.put("Index DigObjekt", indexDigObject(false));

    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String sql = opts.getString("sqlFull").replace("#fields#", fields);
    //sql += " and rownum < 10";
    noErrors = noErrors && indexPredlohy(sql);
    LOGGER.log(Level.INFO, "{0} docs processed", indexed);

    if (clean && noErrors) {
      deleteAll(start);
    }

    ret.put("SUCCESS indexed reliefu", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    solr.close();
    return ret;
  }

  private String readIndexTime() {
    String last = null;
    InputStream inputStream = null;
    JSONObject jsResp;
    try {
      String url = opts.getString("solr.host", "http://localhost:8983/solr/")
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
      String url = opts.getString("solr.host", "http://localhost:8983/solr/")
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

  public boolean indexLists() {

    String sql = "select * from dlists";
    LOGGER.log(Level.INFO, "Processing {0}", sql);
    try {
      solr = getClient();
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
          return false;
        } catch (IOException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
          return false;
        }
        conn.close();
        solr.close();
        return true;
      } catch (SQLException ex) {
        LOGGER.log(Level.SEVERE, "Error getting connection");
        LOGGER.log(Level.SEVERE, null, ex);
        return false;
      }
    } catch (NamingException | IOException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      return false;
    }
  }

  public JSONObject indexDigObject(boolean update) {
    JSONObject ret = new JSONObject();
    String sql = "select digobjekt.*, dk.nazev, dk.zkratka as digknihovna, dk.URLDIGKNIHOVNY, "
            + "nvl(predloha.ccnb, -predloha.id) as cnb_collaps, "
            + "nvl(predloha.ISSN, nvl(predloha.ISBN, -predloha.id)) as isxn_collaps, "
            + "nvl(predloha.SIGLA1, -predloha.id) || nvl(predloha.SYSNO, -predloha.id) as aba_collaps "
            + " from predloha, digobjekt, digknihovna dk"
            + " where digobjekt.rpredloha_digobjekt=predloha.id and dk.id=digobjekt.rdigknihovna_digobjekt";
    if (update) {
      String lastIndexTime = lastDigObjectDate();
      if (lastIndexTime != null) {

        sql += " and predloha.edidate>=to_date('" + lastIndexTime + "', 'yyyy-MM-dd')";
      }
    }
    LOGGER.log(Level.INFO, "Processing {0}", sql);
    try {
      solr = getClient();
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
            solr.add("digobjekt", idocs);
            solr.commit("digobjekt");
            indexed += idocs.size();
            idocs.clear();
          }

          LOGGER.log(Level.INFO, "Index DigObjekt finished. {0} docs processed ", indexed);
          ret.put("msg", indexed + " docs processed");
          solr.close();
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
    } catch (NamingException | SQLException | IOException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      ret.put("error", ex.toString());
    }
    return ret;
  }

  public JSONObject indexDigKnihovny(boolean update) {
    JSONObject ret = new JSONObject();
    String sql = "select * "
            + " from digknihovna";
    if (update) {
      String lastIndexTime = lastDigObjectDate();
      if (lastIndexTime != null) {
        sql += " where edidate>=" + lastIndexTime;
      }
    }
    LOGGER.log(Level.INFO, "Processing {0}", sql);
    try {
      solr = getClient();
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
              solr.add("digknihovny", idocs);
              solr.commit("digknihovny");

              indexed += idocs.size();
              LOGGER.log(Level.INFO, "{0} docs processed ", indexed);
              idocs.clear();
            }
          }
          rs.close();
          ps.close();
          if (!idocs.isEmpty()) {
            solr.add("digknihovny", idocs);
            solr.commit("digknihovny");
            indexed += idocs.size();
            idocs.clear();
          }

          LOGGER.log(Level.INFO, "Index DigKnihovny finished. {0} docs processed ", indexed);
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
      fillDigKnihovnyCache();
      solr.close();
    } catch (NamingException | SQLException | IOException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      ret.put("error", ex.toString());
    }
    return ret;
  }

  public JSONObject indexById(String id) throws IOException {
    LOGGER.log(Level.INFO, "Index by id started ");
    solr = getClient();
    Date start = new Date();
    JSONObject ret = new JSONObject();
    String fields = opts.getJSONArray("db.fields").join(",").replaceAll("\"", "");
    String sql = opts.getString("sqlFull").replace("#fields#", fields);
    sql += " and predloha.idcislo='" + id + "'";
    indexPredlohy(sql);
    ret.put("success", indexed);
    Date end = new Date();
    String ellapsed = FormatUtils.formatInterval(end.getTime() - start.getTime());
    ret.put("ellapsed time", ellapsed);
    LOGGER.log(Level.INFO, "Index finished. {0} docs processed in {1} ", new Object[]{indexed, ellapsed});
    solr.close();
    return ret;
  }

  private boolean indexPredlohy(String sql) {
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
          solr = getClient();
          while (rs.next()) {
            SolrInputDocument idoc = indexRow(rs);
            addCisloVydani(idoc, rs);
            addNeplatneCnb(idoc, rs.getString("id"), conn);
            addNeplatneISBN(idoc, rs.getString("id"), conn);
            addNeplatneISSN(idoc, rs.getString("id"), conn);
            addDigKnihovny(idoc, rs);
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

          LOGGER.log(Level.INFO, "Index predlohy finished. {0} docs processed ", indexed);
        } catch (SolrServerException ex) {
          LOGGER.log(Level.SEVERE, sql);
          LOGGER.log(Level.SEVERE, null, ex);
          return false;
        } catch (IOException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
          return false;
        }
        conn.close();
        return true;
      }
    } catch (NamingException | SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      return false;
    }
  }

  private SolrInputDocument indexRow(ResultSet rs) throws SolrServerException, IOException, SQLException {
    try {
      SolrInputDocument idoc = new SolrInputDocument();
      ResultSetMetaData meta = rs.getMetaData();
      final int columnCount = meta.getColumnCount();

      for (int column = 1; column <= columnCount; column++) {
        Object value = rs.getObject(column);
        if (value instanceof java.math.BigDecimal) {
          idoc.addField(meta.getColumnName(column).toLowerCase(), value.toString());
//        } else if (value instanceof java.sql.Clob) {
//          Reader in = ((java.sql.Clob) value).getCharacterStream();
//          StringWriter w = new StringWriter();
//          IOUtils.copy(in, w);
//          String clobAsString = w.toString();
//          idoc.addField(meta.getColumnName(column).toLowerCase(), clobAsString);

        } else {
          idoc.addField(meta.getColumnName(column).toLowerCase(), value);
        }
      }

      return idoc;
    } catch (Exception ex) {
      LOGGER.log(Level.SEVERE, null, ex);
      return null;
    }
  }

  private void addCisloVydani(SolrInputDocument idoc, ResultSet rs) {
    try {
      Clob clobObject = rs.getClob("xml");
      if(clobObject == null){
        return;
      }
      Reader in = clobObject.getCharacterStream();

      DocumentBuilderFactory builderFactory = DocumentBuilderFactory.newInstance();
      DocumentBuilder builder = builderFactory.newDocumentBuilder();
      Document xmlDocument = builder.parse(IOUtils.toInputStream(IOUtils.toString(in), Charsets.toCharset("UTF8")));
      XPath xPath = XPathFactory.newInstance().newXPath();

      String expression = "//collection/record/datafield[@tag='250']/subfield[@code='a']/text()";
      NodeList nodeList = (NodeList) xPath.compile(expression).evaluate(xmlDocument, XPathConstants.NODESET);
      for (int i = 0; i < nodeList.getLength(); i++) {
        Node node = nodeList.item(i);
        idoc.addField("vydani", node.getNodeValue());
      }
    } catch (SQLException | ParserConfigurationException | IOException | XPathExpressionException | SAXException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private void addNeplatneCnb(SolrInputDocument idoc, String predlohaid, Connection conn) {
    try {
      String sql = "select value from nepccnb "
              + "where RPREDLOHA_NEPCCNB=" + predlohaid;
      PreparedStatement ps = conn.prepareStatement(sql);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          idoc.addField("nep_ccnb", rs.getString("value"));
        }
        rs.close();
      }
      ps.close();
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  private void addNeplatneISBN(SolrInputDocument idoc, String predlohaid, Connection conn) {
    try {
      String sql = "select value from NEPISBN "
              + "where RPREDLOHA_NEPISBN=" + predlohaid;
      PreparedStatement ps = conn.prepareStatement(sql);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          idoc.addField("nep_isbn", rs.getString("value"));
        }
        rs.close();
      }
      ps.close();
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, "Error adding neplatne ISBN", ex);
    }
  }

  private void addNeplatneISSN(SolrInputDocument idoc, String predlohaid, Connection conn) {
    try {
      String sql = "select value from NEPISSN "
              + "where RPREDLOHA_NEPISSN=" + predlohaid;
      PreparedStatement ps = conn.prepareStatement(sql);

      try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
          idoc.addField("nep_issn", rs.getString("value"));
        }
        rs.close();
      }
      ps.close();
    } catch (SQLException ex) {
      LOGGER.log(Level.SEVERE, "Error adding neplatne ISSN", ex);
    }
  }

  private void addDigKnihovnyDb(SolrInputDocument idoc, ResultSet rs, Connection conn) {

    String f = "";
//    try {
//      f = " rpredloha_digobjekt = '" + rs.getString("id") + "'";
//    } catch (SQLException ex) {
//      LOGGER.log(Level.WARNING, ex.toString());
//    }
    try {
      if (rs.getString("url") != null) {
        URI uri = new URI(rs.getString("url").split(" ")[0].trim());
        f += " urldigknihovny like '" + uri.getScheme() + "://" + uri.getHost() + "%'";
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, ex.toString());
    }

    try {
      if (rs.getString("urltitul") != null) {
        URI uri = new URI(rs.getString("urltitul").split(" ")[0].trim());
        if (!"".equals(f)) {
          f += " OR ";
        }
        f += " urldigknihovny like '" + uri.getScheme() + "://" + uri.getHost() + "%'";
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, ex.toString());
    }

    try {
      if (rs.getString("urltitnk") != null) {
        URI uri = new URI(rs.getString("urltitnk").split(" ")[0].trim());
        if (!"".equals(f)) {
          f += " OR ";
        }
        f += " urldigknihovny like '" + uri.getScheme() + "://" + uri.getHost() + "%'";
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, ex.toString());
    }

    if (!"".equals(f)) {
      try {
        f = " where " + f;
        String sql = "select distinct(nazev) from digknihovna" + f;

        PreparedStatement ps = conn.prepareStatement(sql);
        int i = 0;
        try (ResultSet rsdk = ps.executeQuery()) {
          while (rsdk.next()) {
            idoc.addField("digknihovna", rsdk.getString("nazev"));
            i++;
          }
          rsdk.close();
        }
//        LOGGER.log(Level.INFO, "searching digknihovna with {0}, rows {1}", new Object[]{sql, i});
        ps.close();
      } catch (SQLException ex) {
        LOGGER.log(Level.SEVERE, null, ex);
      }
    }

    try {
      //Add from digobjekt core
      //params.set('q', 'rpredloha_digobjekt:"' + rs.getString("id").trim() + '"');
      SolrQuery q = new SolrQuery();
      q.setQuery("rpredloha_digobjekt:" + rs.getString("id").trim());
      q.setRows(1000);
      QueryResponse qr = solr.query("digobjekt", q);
      for (SolrDocument sdoc : qr.getResults()) {
        idoc.addField("digknihovna", sdoc.getFirstValue("nazev"));
      }
    } catch (SQLException | SolrServerException | IOException ex) {
      LOGGER.log(Level.WARNING, null, ex);
    }
  }

  private void addDigKnihovny(SolrInputDocument idoc, ResultSet rs) {
//    String f = "";
    List<String> dks = new ArrayList<>();
    try {
      if (rs.getString("url") != null) {
        URI uri = new URI(rs.getString("url").split(" ")[0].trim());
        dks.add(digKnihovnyCached.get(uri.getHost()));
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, ex.toString());
    }
    try {

      if (rs.getString("urltitul") != null) {
        URI uri = new URI(rs.getString("urltitul").split(" ")[0].trim());
        if (!dks.contains(digKnihovnyCached.get(uri.getHost()))) {
          dks.add(digKnihovnyCached.get(uri.getHost()));
        }
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, ex.toString());
    }

    try {
      if (rs.getString("urltitnk") != null) {
        URI uri = new URI(rs.getString("urltitnk").split(" ")[0].trim());
        if (!dks.contains(digKnihovnyCached.get(uri.getHost()))) {
          dks.add(digKnihovnyCached.get(uri.getHost()));
        }
      }
    } catch (SQLException | URISyntaxException ex) {
      LOGGER.log(Level.WARNING, ex.toString());
    }

//    if (!"".equals(f)) {
//      try {
//        SolrQuery q = new SolrQuery();
//        q.setQuery(f);
//        q.setRows(1000);
//        QueryResponse qr = solr.query("digknihovny", q);
//        for (SolrDocument sdoc : qr.getResults()) {
//          idoc.addField("digknihovna", sdoc.getFirstValue("nazev"));
//        }
//      } catch (SolrServerException | IOException ex) {
//        LOGGER.log(Level.SEVERE, null, ex);
//      }
//    }
    try {
      //Add from digobjekt core
      SolrClient solr2 = getClient();
      SolrQuery q = new SolrQuery();
      q.setQuery("rpredloha_digobjekt:" + rs.getString("id").trim());
      q.setRows(1000);
      QueryResponse qr = solr2.query("digobjekt", q);
      //String lookUpField = "nazev";
      String lookUpField = "digknihovna";
      for (SolrDocument sdoc : qr.getResults()) {

        if (!dks.contains((String) sdoc.getFirstValue(lookUpField))) {
          dks.add((String) sdoc.getFirstValue(lookUpField));

        }
        //idoc.addField("digknihovna", sdoc.getFirstValue("nazev"));
      }
      solr2.close();
    } catch (SQLException | SolrServerException | IOException ex) {
      LOGGER.log(Level.WARNING, null, ex);
    }

    for (String dk : dks) {
      idoc.addField("digknihovna", dk);
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

  private void fillDigKnihovnyCache() {

    //String lookUpField = "nazev";
    String lookUpField = "zkratka";
    try {
      SolrQuery q = new SolrQuery();
      q.setQuery("*:*").setFields("urldigknihovny", lookUpField).setRows(1000);
      QueryResponse qr = solr.query("digknihovny", q);
      for (SolrDocument sdoc : qr.getResults()) {

        if (sdoc.getFirstValue("urldigknihovny") != null) {
          URI uri = new URI(((String) sdoc.getFirstValue("urldigknihovny")).trim());
          digKnihovnyCached.put(uri.getHost(), (String) sdoc.getFirstValue(lookUpField));
        }

      }
    } catch (SolrServerException | IOException | URISyntaxException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

}
