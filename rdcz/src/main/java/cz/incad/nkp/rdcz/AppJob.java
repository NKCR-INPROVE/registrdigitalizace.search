/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.incad.nkp.rdcz;


import java.util.logging.Level;
import java.util.logging.Logger;
import org.json.JSONObject;
import org.quartz.InterruptableJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.SchedulerException;
import org.quartz.UnableToInterruptJobException;

/**
 *
 * @author alberto
 */
public class AppJob implements InterruptableJob {

    private static final Logger LOGGER = Logger.getLogger(AppJob.class.getName());
    
    JSONObject jobdata;

    @Override
    public void execute(JobExecutionContext jec) throws JobExecutionException {
        try {
            String jobKey = jec.getJobDetail().getKey().toString();
            int i = 0;
            for (JobExecutionContext j : jec.getScheduler().getCurrentlyExecutingJobs()) {
                if (jobKey.equals(j.getJobDetail().getKey().toString())) {
                    i++;
                }
            }
            if (i > 1) {
                LOGGER.log(Level.INFO, "jobKey {0} is still running. Nothing to do.", jobKey);
                return;
            }

            JobDataMap data = jec.getMergedJobDataMap();
            
            String jobName = (String) data.get("jobname");

      jobdata = Options.getInstance().getJSONObject("jobs").getJSONObject(jobName);
      jobdata.put("interrupted", false);


            if(jobdata.getString("type").equalsIgnoreCase("admin")){
                //AdminJob aj = new AdminJob(jobdata);
                //aj.run();
            }else if(jobdata.getString("type").equalsIgnoreCase("harvest")){
                //OAIHarvester oh = new OAIHarvester(new HarvesterJobData(jobdata));
                //oh.harvest();
            }else if(jobdata.getString("type").equalsIgnoreCase("index")){
                Indexer indexer =  new Indexer();
                indexer.run(jobdata);
            }

            LOGGER.log(Level.FINE, "job {0} finished", jobKey);

        } catch (SchedulerException ex) {
            LOGGER.log(Level.SEVERE, null, ex);
        } catch (Exception ex) {
            Logger.getLogger(AppJob.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Override
    public void interrupt() throws UnableToInterruptJobException {
        //Thread.currentThread().interrupt();
//        jobdata.setInterrupted(true);
    }

}
