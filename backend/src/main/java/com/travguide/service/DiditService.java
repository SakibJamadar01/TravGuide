package com.travguide.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class DiditService {

    @Value("${didit.api-key}")
    private String apiKey;

    @Value("${didit.workflow-id}")
    private String workflowId;

    @Value("${didit.api-url:https://verification.didit.me}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Creates a new Didit verification session.
     *
     * @param vendorData A unique identifier for the user (e.g., guide email)
     * @return Map containing "url" (for SDK) and "session_id"
     */
    public Map<String, String> createSession(String vendorData) {
        String url = apiUrl + "/v3/session/";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("workflow_id", workflowId);
        body.put("vendor_data", vendorData);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, request, Map.class
        );

        Map<String, String> result = new HashMap<>();
        Map responseBody = response.getBody();
        if (responseBody != null) {
            result.put("url", String.valueOf(responseBody.get("url")));
            result.put("session_id", String.valueOf(responseBody.get("session_id")));
        }
        return result;
    }

    public String getSessionUrl(String sessionId) {
        try {
            String url = apiUrl + "/v3/session/" + sessionId + "/";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-api-key", apiKey);
            
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, request, Map.class
            );
            
            Map responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("url")) {
                return String.valueOf(responseBody.get("url"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
    public String getSessionStatus(String sessionId) {
        try {
            // First hit the session endpoint itself
            String sessionUrl = apiUrl + "/v3/session/" + sessionId + "/";
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-api-key", apiKey);
            HttpEntity<Void> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> sessionResponse = restTemplate.exchange(
                    sessionUrl, HttpMethod.GET, request, Map.class
            );
            
            Map sessionBody = sessionResponse.getBody();
            System.out.println("Session Endpoint Body: " + sessionBody);
            
            String sessionStatus = null;
            if (sessionBody != null && sessionBody.containsKey("status")) {
                sessionStatus = String.valueOf(sessionBody.get("status"));
                if ("Approved".equalsIgnoreCase(sessionStatus) || "Verified".equalsIgnoreCase(sessionStatus)) {
                    return sessionStatus;
                }
            }

            // Fallback to decision endpoint
            String decisionUrl = apiUrl + "/v3/session/" + sessionId + "/decision/";
            ResponseEntity<Map> decisionResponse = restTemplate.exchange(
                    decisionUrl, HttpMethod.GET, request, Map.class
            );
            
            Map decisionBody = decisionResponse.getBody();
            System.out.println("Decision Endpoint Body: " + decisionBody);
            
            if (decisionBody != null) {
                if (decisionBody.containsKey("decision")) {
                    String decision = String.valueOf(decisionBody.get("decision"));
                    if (!"Not Started".equalsIgnoreCase(decision)) {
                        return decision;
                    }
                }
                if (decisionBody.containsKey("status")) {
                    String dStatus = String.valueOf(decisionBody.get("status"));
                    if (!"Not Started".equalsIgnoreCase(dStatus)) {
                        return dStatus;
                    }
                }
            }
            
            return sessionStatus != null ? sessionStatus : "Not Started";
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
