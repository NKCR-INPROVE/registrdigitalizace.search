package cz.incad.nkp.rdcz;

import java.io.File;
import java.io.FileFilter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Arrays;
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
    File[] listOfFiles = folder.listFiles(new FileFilter() {
      @Override
      public boolean accept(File pathname) {
        return pathname.getName().indexOf(".htm") > 0 || (pathname.isDirectory() && !pathname.getName().equals("img"));
      }
    });

    setFiles(json, listOfFiles);
    return json;
  }
  private static void setFiles(JSONObject json, File[] listOfFiles) {
    List<String> files = new ArrayList<>();
    for (File file : listOfFiles) {
              if (file.isFile()) {
                String shortName = file.getName().split("\\.")[0];
                int under = shortName.lastIndexOf("_cs");
                if(under > -1){
                  shortName = shortName.substring(0, under);
                } else {
                  under = shortName.lastIndexOf("_en");
                  if(under > -1){
                    shortName = shortName.substring(0, under);
                  }
                }
                
                if (!files.contains(shortName)) {
                  files.add(shortName);
                  json.append("files", shortName);
                }
              } else if (file.isDirectory()) {
                json.append("dirs", dirToJson(file));
              }
            }
  }
  
  private static JSONObject findMenuItem(JSONObject menu, JSONObject menu_item, boolean isNew){
    LOGGER.log(Level.FINE, "menu_item: {0}", menu_item);
    ArrayList<String> menu_path =  new ArrayList<String>(Arrays.asList(menu_item.getString("path").split("/")));
    menu_path.remove(0);
    if(!isNew){
      menu_path.add(menu_item.getJSONObject("menuitem").getString("name"));
    }
    JSONObject item = menu;
    for(String m : menu_path){
      //item = menu.get
      for(int i=0;i < item.getJSONArray("pages").length(); i++){
        String name = item.getJSONArray("pages").getJSONObject(i).getString("name");
        if(m.equals(name)){
          item = item.getJSONArray("pages").getJSONObject(i);
          break;
        }
      }
    }
    return item;
  }
  

  enum Actions {
    LIST {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse resp) throws Exception {

        resp.setContentType("application/json;charset=UTF-8");

        PrintWriter out = resp.getWriter();
        JSONObject json = new JSONObject();
        try {
          String path = InitServlet.CONFIG_DIR + File.separator + "menu.json";
          String s = FileUtils.readFileToString(new File(path), "UTF-8");
          json = new JSONObject(s);
        } catch (Exception ex) {
          LOGGER.log(Level.SEVERE, "error getting file list. Error: {0}", ex);
          json.put("error", ex.toString());
        }
        out.println(json.toString(2));
      }
    },
    SAVEMENU {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse resp) throws Exception {

        resp.setContentType("application/json;charset=UTF-8");

        PrintWriter out = resp.getWriter();
        JSONObject json = new JSONObject();
        try {

          String path = InitServlet.CONFIG_DIR + File.separator + "menu.json";
          
          //the new menu item
          JSONObject new_menu = new JSONObject(request.getParameter("menu"));
          FileUtils.write(new File(path), new_menu.toString(2), "UTF-8");
          
        } catch (Exception ex) {
          LOGGER.log(Level.SEVERE, "error saving menu. Error: {0}", ex.toString());
          json.put("error", ex.toString());
        }
        out.println(json.toString(2));
      }
    },
    SAVEMENU2 {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse resp) throws Exception {

        resp.setContentType("application/json;charset=UTF-8");

        PrintWriter out = resp.getWriter();
        JSONObject json = new JSONObject();
        try {

          String path = InitServlet.CONFIG_DIR + File.separator + "menu.json";

          String s = FileUtils.readFileToString(new File(path), "UTF-8");
          JSONObject menu = new JSONObject(s);
          
          //the new menu item
          JSONObject menu_item = new JSONObject(request.getParameter("menu"));
          JSONObject item = findMenuItem(menu, menu_item, false);
          LOGGER.log(Level.FINE, "item: {0}", item);
          item.put("cs", menu_item.getJSONObject("menuitem").get("cs"));
          item.put("en", menu_item.getJSONObject("menuitem").get("en"));
          LOGGER.log(Level.FINE, "menu: {0}", menu);
          FileUtils.write(new File(path), menu.toString(2), "UTF-8");
          
        } catch (Exception ex) {
          LOGGER.log(Level.SEVERE, "error saving menu. Error: {0}", ex.toString());
          json.put("error", ex.toString());
        }
        out.println(json.toString(2));
      }
    },
    INSERT_MENU {
      @Override
      void doPerform(HttpServletRequest request, HttpServletResponse resp) throws Exception {

        resp.setContentType("application/json;charset=UTF-8");

        PrintWriter out = resp.getWriter();
        JSONObject json = new JSONObject();
        try {

          String path = InitServlet.CONFIG_DIR + File.separator + "menu.json";

          String s = FileUtils.readFileToString(new File(path), "UTF-8");
          JSONObject menu = new JSONObject(s);
          
          //the new menu item
          JSONObject menu_item = new JSONObject(request.getParameter("menu"));
          int index = Integer.parseInt(request.getParameter("idx"));
          JSONObject item = findMenuItem(menu, menu_item, true);
          
          LOGGER.log(Level.FINE, "item: {0}", item);
          if(item.has("pages")){
            int length = item.getJSONArray("pages").length();
            for(int i=length; i>index; i-- ){
              item.getJSONArray("pages").put(i, item.getJSONArray("pages").get(i-1));
            }
            item.getJSONArray("pages").put(index, menu_item.getJSONObject("menuitem"));
          } else {
            item.append("pages", menu_item.getJSONObject("menuitem"));
          }
          LOGGER.log(Level.FINE, "menu: {0}", menu);
          
          FileUtils.write(new File(path), menu.toString(2), "UTF-8");
        } catch (Exception ex) {
          LOGGER.log(Level.SEVERE, "error saving menu. Error: {0}", ex.toString());
          json.put("error", ex.toString());
        }
        out.println(json.toString(2));
      }
    },
    LIST_DIR {
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
            
            File[] listOfFiles = folder.listFiles(new FileFilter() {
              @Override
              public boolean accept(File pathname) {
                return pathname.getName().indexOf(".htm") > 0 || (pathname.isDirectory() && !pathname.getName().equals("img"));
              }
            });
            setFiles(json, listOfFiles);
          } else {
            json.put("files", new JSONArray());
          }

        } catch (Exception ex) {
          LOGGER.log(Level.SEVERE, "error getting file list. Error: {0}", ex);
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
        if (lang != null && !"undefined".equals(lang)) {
          f = new File(filename + "_" + lang + ".html");
          if (f.exists()) {
            FileUtils.copyFile(f, response.getOutputStream());
          } else {
            f = new File(filename + ".html");
            if (f.exists()) {
              FileUtils.copyFile(f, response.getOutputStream());
            } else {
              response.getWriter().println("Text not found in <div>" + filename + ".html</div>");
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
        
        LOGGER.log(Level.INFO, filename);

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
  
  class FileFilterClass{
    
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
