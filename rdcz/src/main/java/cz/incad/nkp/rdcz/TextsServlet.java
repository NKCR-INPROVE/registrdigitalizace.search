package cz.incad.nkp.rdcz;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class TextsServlet extends HttpServlet {

  public static final Logger LOGGER = Logger.getLogger(TextsServlet.class.getName());
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

        Actions actionToDo = Actions.valueOf(actionNameParam.toUpperCase());
        actionToDo.doPerform(request, response);

      } else {

        Actions actionToDo = Actions.valueOf("LOAD");
        actionToDo.doPerform(request, response);
//        PrintWriter out = response.getWriter();
//        out.print("Action missing");
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

  private static JSONObject dirToJson(File folder) {
    JSONObject json = new JSONObject();
    json.put("name", folder.getName()).put("dirs", new JSONArray()).put("files", new JSONArray());;
    List<String> files = new ArrayList<>();
    File[] listOfFiles = folder.listFiles();

    for (File file : listOfFiles) {
      if (file.isFile()) {
        String shortName = file.getName().split("\\.")[0].split("_")[0];
        if (!files.contains(shortName)) {
          files.add(shortName);
          json.append("files", shortName);
        }
      } else if (file.isDirectory()) {
        json.append("dirs", dirToJson(file));
      }
    }
    System.out.println(json);
    return json;

  }

  enum Actions {
    LIST {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse resp) throws Exception {

        resp.setContentType("application/json;charset=UTF-8");

        PrintWriter out = resp.getWriter();
        JSONObject json = new JSONObject();
        try {

          String path = InitServlet.CONFIG_DIR + File.separator + "pages";

          File folder = new File(path);
          if (folder.exists()) {
            json.put("name", folder.getName()).put("dirs", new JSONArray()).put("files", new JSONArray());
            List<String> files = new ArrayList<>();
            File[] listOfFiles = folder.listFiles();
            for (File file : listOfFiles) {
          System.out.println(json);
              if (file.isFile()) {
                String shortName = file.getName().split("\\.")[0].split("_")[0];
                if (!files.contains(shortName)) {
                  files.add(shortName);
                  json.append("files", shortName);
                }
              } else if (file.isDirectory()) {
                json.append("dirs", dirToJson(file));
              }
            }
          } else {
            json.put("files", new JSONArray());
          }
          System.out.println(json);

        } catch (Exception ex) {
          LOGGER.log(Level.SEVERE, "error during file upload. Error: {0}", ex);
          json.put("error", ex.toString());
        }
        out.println(json.toString(2));
      }
    },
    LOAD {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

        response.setContentType("text/html;charset=UTF-8");
        String lang = request.getParameter("lang");
//        String filename = InitServlet.CONFIG_DIR + File.separator + "texts"
//                + File.separator + request.getParameter("id");
        String filename = InitServlet.CONFIG_DIR 
                + File.separator + request.getParameter("id");
        File f;
        if (lang != null) {
          f = new File(filename + "_" + lang + ".html");
          if (f.exists()) {
            FileUtils.copyFile(f, response.getOutputStream());
          } else {
            f = new File(filename + ".html");
            if (f.exists()) {
              FileUtils.copyFile(f, response.getOutputStream());
            } else {
              response.getWriter().println("Text not found in <h1>" + filename + ".html</h1>");
            }
          }
        } else {
          f = new File(filename + ".html");
          if (f.exists()) {
            FileUtils.copyFile(f, response.getOutputStream());
          } else {
            response.getWriter().println("Text not found in <h1>" + filename + ".html</h1>");
          }
        }
      }
    },
    SAVE {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse response) throws Exception {

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        JSONObject json = new JSONObject();

        String id = request.getParameter("id");
        String lang = request.getParameter("lang");
//        String filename = InitServlet.CONFIG_DIR + File.separator + "texts"
//                + File.separator + id;
        String filename = InitServlet.CONFIG_DIR 
                + File.separator + id;
        File f;
        String text = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

        if (lang != null) {
          f = new File(filename + "_" + lang + ".html");
          FileUtils.writeStringToFile(f, text, Charset.forName("UTF-8"));
        } else {
          f = new File(filename + ".html");
          FileUtils.writeStringToFile(f, text, Charset.forName("UTF-8"));
        }

        String menu = request.getParameter("menu");
        if (menu != null) {
          String fnmenu = InitServlet.CONFIG_DIR + File.separator + "menu.json";
          File fmenu = new File(fnmenu);
          FileUtils.writeStringToFile(fmenu, menu, Charset.forName("UTF-8"));
          Options.resetInstance();
        }

        LOGGER.log(Level.INFO, json.toString());
        out.println(json.toString(2));
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
