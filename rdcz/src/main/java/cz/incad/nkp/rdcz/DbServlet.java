/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.incad.nkp.rdcz;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.Reader;
import java.io.StringWriter;
import java.net.InetAddress;
import java.sql.Clob;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.sql.DataSource;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.apache.commons.io.Charsets;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/**
 *
 * @author alberto.a.hernandez
 */
public class DbServlet extends HttpServlet {

  public static final Logger LOGGER = Logger.getLogger(DbServlet.class.getName());
  public static final String ACTION_NAME = "action";

  /**
   * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
   * methods.
   *
   * @param request servlet request
   * @param response servlet response
   * @throws ServletException if a servlet-specific error occurs
   * @throws IOException if an I/O error occurs
   */
  protected void processRequest(HttpServletRequest request, HttpServletResponse response)
          throws ServletException, IOException {

    try {
      String actionNameParam = request.getParameter(ACTION_NAME);
      if (actionNameParam != null) {

        Set<String> localAddresses = new HashSet<String>();
        localAddresses.add(InetAddress.getLocalHost().getHostAddress());
        for (InetAddress inetAddress : InetAddress.getAllByName("localhost")) {
          localAddresses.add(inetAddress.getHostAddress());
        }
        if (localAddresses.contains(request.getRemoteAddr())) {
          LOGGER.log(Level.INFO, "running from local address");
          Actions actionToDo = Actions.valueOf(actionNameParam.toUpperCase());
          actionToDo.doPerform(request, response);
        } else {
          PrintWriter out = response.getWriter();
          out.print("Insuficient rights");
        }
      } else {
        PrintWriter out = response.getWriter();
        out.print("Action missing");
      }
    } catch (IOException e1) {
      LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
      response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e1.toString());
      PrintWriter out = response.getWriter();
      out.print(e1.toString());
    } catch (SecurityException e1) {
      LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    } catch (Exception e1) {
      LOGGER.log(Level.SEVERE, e1.getMessage(), e1);
      response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      PrintWriter out = response.getWriter();
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e1.toString());
      out.print(e1.toString());
    }
  }

  enum Actions {
    QUERY {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

        response.setContentType("application/json;charset=UTF-8");

        PrintWriter out = response.getWriter();

        JSONObject ret = new JSONObject();
        String sql = request.getParameter("q");

        LOGGER.log(Level.INFO, "Processing {0}", sql);
        try {
          Context initContext = new InitialContext();
          Context envContext = (Context) initContext.lookup("java:/comp/env");
          DataSource ds = (DataSource) envContext.lookup("jdbc/rlf");
          try (Connection conn = ds.getConnection()) {
            PreparedStatement ps = conn.prepareStatement(sql);

            try (ResultSet rs = ps.executeQuery()) {
              while (rs.next()) {
                JSONObject row = new JSONObject();

                ResultSetMetaData meta = rs.getMetaData();
                final int columnCount = meta.getColumnCount();

                for (int column = 1; column <= columnCount; column++) {
                  Object value = rs.getObject(column);
                  if (value instanceof java.math.BigDecimal) {
                    row.put(meta.getColumnName(column).toLowerCase(), value.toString());
                  } else {
                    row.put(meta.getColumnName(column).toLowerCase(), value);
                  }
                }
                ret.append("rows", row);
              }
              rs.close();
              ps.close();

            }
            conn.close();
          }
        } catch (NamingException | SQLException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
          ret.put("error", ex.toString());
        }

        out.println(ret.toString(2));
      }
    },
    XML {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

        response.setContentType("application/json;charset=UTF-8");

        PrintWriter out = response.getWriter();

        JSONObject ret = new JSONObject();
        String sql = "select xml from predloha where id=" + request.getParameter("id");

        LOGGER.log(Level.INFO, "Processing {0}", sql);
        try {
          Context initContext = new InitialContext();
          Context envContext = (Context) initContext.lookup("java:/comp/env");
          DataSource ds = (DataSource) envContext.lookup("jdbc/rlf");
          try (Connection conn = ds.getConnection()) {
            PreparedStatement ps = conn.prepareStatement(sql);

            try (ResultSet rs = ps.executeQuery()) {
              while (rs.next()) {
                JSONObject row = new JSONObject();
                Clob clobObject = rs.getClob("xml");
                Reader in = clobObject.getCharacterStream();
//                StringWriter w = new StringWriter();
//                IOUtils.copy(in, w);
//                String clobAsString = w.toString();

                DocumentBuilderFactory builderFactory = DocumentBuilderFactory.newInstance();
                DocumentBuilder builder = builderFactory.newDocumentBuilder();
                Document xmlDocument = builder.parse(IOUtils.toInputStream(IOUtils.toString(in), Charsets.toCharset("UTF8")));
                XPath xPath = XPathFactory.newInstance().newXPath();
                
                String expression = request.getParameter("xpath");
//                LOGGER.log(Level.INFO, "xpath {0}", expression);
//                LOGGER.log(Level.INFO, "val {0}", xPath.compile(expression).evaluate(xmlDocument));
                NodeList nodeList = (NodeList) xPath.compile(expression).evaluate(xmlDocument, XPathConstants.NODESET);
                for (int i = 0; i < nodeList.getLength(); i++) {
                  Node node = nodeList.item(i);
                  //LOGGER.log(Level.INFO, "node {0}", node.getNodeName());
                  ret.append("nodes", node.getNodeValue());
                }
//                ret.put("xml", org.json.XML.toJSONObject(clobAsString));
              }
              rs.close();
              ps.close();

            }
            conn.close();
          }
        } catch (NamingException | SQLException ex) {
          LOGGER.log(Level.SEVERE, null, ex);
          ret.put("error", ex.toString());
        }

        out.println(ret.toString(2));
      }
    };

    abstract void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception;
  }

  // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
  /**
   * Handles the HTTP <code>GET</code> method.
   *
   * @param request servlet request
   * @param response servlet response
   * @throws ServletException if a servlet-specific error occurs
   * @throws IOException if an I/O error occurs
   */
  @Override
  protected void doGet(HttpServletRequest request, HttpServletResponse response)
          throws ServletException, IOException {
    processRequest(request, response);
  }

  /**
   * Handles the HTTP <code>POST</code> method.
   *
   * @param request servlet request
   * @param response servlet response
   * @throws ServletException if a servlet-specific error occurs
   * @throws IOException if an I/O error occurs
   */
  @Override
  protected void doPost(HttpServletRequest request, HttpServletResponse response)
          throws ServletException, IOException {
    processRequest(request, response);
  }

  /**
   * Returns a short description of the servlet.
   *
   * @return a String containing servlet description
   */
  @Override
  public String getServletInfo() {
    return "Short description";
  }// </editor-fold>

}
