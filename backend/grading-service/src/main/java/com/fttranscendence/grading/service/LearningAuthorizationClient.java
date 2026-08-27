package com.fttranscendence.grading.service;
import com.fttranscendence.grading.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*; import org.springframework.stereotype.Service; import org.springframework.web.client.RestTemplate;
@Service public class LearningAuthorizationClient {
  private final RestTemplate rest; @Value("${learning.service.url:http://localhost:8083}") private String base;
  public LearningAuthorizationClient(RestTemplate rest){this.rest=rest;}
  public void assertCanSubmit(AuthenticatedUser user,String bearer,long studentId){ String path="STUDENT".equals(user.role())?"/api/learning/student/profile":"/api/learning/tutor/students/"+studentId; try { HttpHeaders h=new HttpHeaders(); h.set("Authorization",bearer); ResponseEntity<java.util.Map> r=rest.exchange(base+path,HttpMethod.GET,new HttpEntity<>(h),java.util.Map.class); if(!r.getStatusCode().is2xxSuccessful() || ("STUDENT".equals(user.role()) && !java.util.Objects.equals(((Number)r.getBody().get("id")).longValue(),studentId))) throw new Forbidden(); } catch(Forbidden e){throw e;} catch(Exception e){throw new Forbidden();} }
  public static class Forbidden extends RuntimeException { }
}
