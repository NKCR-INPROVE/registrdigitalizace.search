package cz.incad.nkp.rdcz;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.http.client.utils.URIBuilder;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.XML;

/**
 *
 * @author alberto
 */
public class AlephServlet extends HttpServlet {

  public static final Logger LOGGER = Logger.getLogger(AlephServlet.class.getName());

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
    response.setContentType("application/json;charset=UTF-8");

    try (PrintWriter out = response.getWriter()) {
      response.addHeader("Access-Control-Allow-Origin", "http://localhost:4200");
      //response.setContentType("text/xml;charset=UTF-8");
      response.addHeader("Access-Control-Allow-Methods", "GET, POST");
      response.addHeader("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

      JSONObject ret = new JSONObject();
      Options opts = Options.getInstance();

      String barCode = request.getParameter("bc");

      LOGGER.log(Level.INFO, "requesting barCode {0}", barCode);

      String host = opts.getString("aleph.def.host");
      String base = opts.getString("aleph.def.base");
      JSONArray alephHosts = opts.getJSONArray("aleph");
      for (int i = 0; i < alephHosts.length(); i++) {
        JSONArray prefixes = alephHosts.getJSONObject(i).getJSONArray("prefixes");
        for (int j = 0; j < prefixes.length(); j++) {
          if (barCode.startsWith(prefixes.getString(j))) {
            host = alephHosts.getJSONObject(i).getString("host");
            base = alephHosts.getJSONObject(i).getString("base");
            break;
          }
        }
      }

      //url += "?" + request.getQueryString();
      URI uri = new URIBuilder().setScheme("http")
              .setHost(host)
              //.setPath("/X")
              .setParameter("base", base)
              .setParameter("op", "find")
              .setParameter("request", "bc=" + barCode)
              .build();

      LOGGER.log(Level.INFO, "requesting url {0}", uri.toString());
      InputStream inputStream = RESTHelper.inputStream(uri.toString());

      String xml = org.apache.commons.io.IOUtils.toString(inputStream, Charset.forName("UTF-8"));
      JSONObject json = XML.toJSONObject(xml);

      LOGGER.log(Level.FINE, "response is json {0}", json);
      if (json.has("find")) {
        if (json.getJSONObject("find").has("error")) {
          ret.put("numFound", 0).put("error", json.getJSONObject("find").getString("error"));
        } else {
          int no_records = Integer.parseInt(json.getJSONObject("find").getString("no_records"));

          LOGGER.log(Level.FINE, "no_records integer... {0}", no_records);
          if (no_records > 0) {
            ret.put("numFound", no_records);
//        
//        params.set('op', 'present');
//    params.set('format', 'marc');
//    params.set('set_no', set_no);
//    params.set('set_entry', '1-' +no_records);
//    
            uri = new URIBuilder().setScheme("http")
                    .setHost(host)
                    //.setPath("/X")
                    .setParameter("base", base)
                    .setParameter("op", "present")
                    .setParameter("format", "marc")
                    .setParameter("set_no", json.getJSONObject("find").getInt("set_number") + "")
                    .setParameter("set_entry", "1-" + json.getJSONObject("find").getString("no_records"))
                    .build();
            
      LOGGER.log(Level.INFO, "find... {0}", uri.toString());
      
            inputStream = RESTHelper.inputStream(uri.toString());
            xml = org.apache.commons.io.IOUtils.toString(inputStream, Charset.forName("UTF-8"));
            JSONObject marc = XML.toJSONObject(xml);

            ret.put("marc", marc);

          } else {
            ret.put("numFound", 0);
          }
        }
      } else {
        //{"html":{"head":{"title":"Error 403"},"body":{"h1":"Error 403 Forbidden","i":"194.108.215.43","content":["Access from IP address","not allowed."]}}}
        ret.put("numFound", 0).put("error", json);
      }
      out.print(ret.toString(2));
      //out.print(xml);
    } catch (URISyntaxException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
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
