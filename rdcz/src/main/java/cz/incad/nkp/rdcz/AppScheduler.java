package cz.incad.nkp.rdcz;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.io.FileUtils;
import org.json.JSONObject;
import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.TriggerBuilder;
import org.quartz.core.jmx.JobDataMapSupport;
import org.quartz.impl.StdSchedulerFactory;

/**
 *
 * @author alberto
 */
public class AppScheduler {

  static final Logger LOGGER = Logger.getLogger(AppScheduler.class.getName());
  private static AppScheduler _sharedInstance = null;
  private org.quartz.Scheduler scheduler;
    boolean paused;
    boolean indexerPaused;
    

  public synchronized static AppScheduler getInstance() {
    if (_sharedInstance == null) {
      _sharedInstance = new AppScheduler();
    }
    return _sharedInstance;
  }

  public AppScheduler() {
    try {
      SchedulerFactory sf = new StdSchedulerFactory();
      scheduler = sf.getScheduler();
    } catch (SchedulerException ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }
  }

  /**
   * @return the scheduler
   */
  public org.quartz.Scheduler getScheduler() {
    return scheduler;
  }
    
    public static JobDataMap setData(String jobName) throws Exception{
        Map<String, Object> map = new HashMap<String, Object>();
        map.put("jobname", jobName);
        return JobDataMapSupport.newJobDataMap(map);
    }
    

 public static void addJob(String jobName, JSONObject js) throws Exception{
        org.quartz.Scheduler sched = AppScheduler.getInstance().getScheduler();
        
        JobDataMap data = setData(jobName);
        JobDetail job = JobBuilder.newJob(AppJob.class)
                .withIdentity(jobName)
                .setJobData(data)
                .build();
        if (sched.checkExists(job.getKey())) {
            sched.deleteJob(job.getKey());
        }
        String cronVal = js.optString("cron", "");
        if(cronVal.equals("")){
            sched.addJob(job, true, true);
            LOGGER.log(Level.INFO, "Job {0} added to scheduler", jobName);
            
        }else{
            CronTrigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity("trigger_" + jobName)
                    .withSchedule(CronScheduleBuilder.cronSchedule(cronVal))
                    .build();
            sched.scheduleJob(job, trigger);
            LOGGER.log(Level.INFO, "Job {0} added to scheduler with {1}", new Object[]{jobName, cronVal});
        }
    }

  public void getJobs() throws SchedulerException {

    try {

      JSONObject jobs = Options.getInstance().getJSONObject("jobs");
                for(Object key : jobs.keySet()){
                  addJob((String)key, jobs.getJSONObject((String) key));
                }

    } catch (Exception ex) {
      LOGGER.log(Level.SEVERE, null, ex);
    }

  }
  
  
    
    public void setPaused(boolean paused){
      this.paused = paused;
    }
    
    public boolean isPaused(){
      return this.paused;
    }
    
    
    public void setIndexerPaused(boolean paused){
      this.indexerPaused = paused;
    }
    
    public boolean isIndexerPaused(){
      return this.indexerPaused;
    }
    

}
