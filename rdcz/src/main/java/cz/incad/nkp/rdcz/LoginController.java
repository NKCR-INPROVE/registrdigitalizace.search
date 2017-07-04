package cz.incad.nkp.rdcz;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.http.HttpServletRequest;
import org.json.JSONException;
import org.json.JSONObject;

/**
 *
 * @author alberto
 */
public class LoginController {
  public static JSONObject get(HttpServletRequest req){
    JSONObject jo = new JSONObject();
    Object session = req.getSession().getAttribute("login");
    if(session != null){
      return (JSONObject) session;
    } else {
      return null;
    }
  }
  
  public static void logout(HttpServletRequest req){
    req.getSession().invalidate();
  }
  
  public static boolean login(HttpServletRequest req, String user, String pwd){
    try {
      JSONObject jo = new JSONObject();
      Options opts = Options.getInstance();
      if(opts.getJSONObject("users").has(user) &&
              opts.getJSONObject("users").getString(user).equals(pwd)){
        jo.put(opts.getJSONObject("users").getString(user), "logged");
        req.getSession().setAttribute("login", jo);
        return true;
      }
      return false;
    } catch (IOException | JSONException ex) {
      Logger.getLogger(LoginController.class.getName()).log(Level.SEVERE, null, ex);
      return false;
    }
  }
}
