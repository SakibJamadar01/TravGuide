package com.travguide.controller;

import com.travguide.model.Guide;
import com.travguide.repository.GuideRepository;
import com.travguide.service.DiditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/verification")
@CrossOrigin(origins = "*")
public class VerificationController {

    @Autowired
    private DiditService diditService;

    @Autowired
    private GuideRepository guideRepository;

    /**
     * Frontend calls this to get a Didit session URL for a specific guide.
     */
    @PostMapping("/session")
    public ResponseEntity<?> createVerificationSession(@RequestBody Map<String, Long> request) {
        Long guideId = request.get("guideId");
        if (guideId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "guideId is required"));
        }

        Optional<Guide> optionalGuide = guideRepository.findById(guideId);
        if (optionalGuide.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Guide guide = optionalGuide.get();
        
        try {
            // If the guide already has a pending session, try to reuse it
            if (guide.getDiditSessionId() != null && guide.getVerificationStatus() == Guide.VerificationStatus.PENDING) {
                String sessionUrl = guide.getDiditSessionUrl();
                
                // Recover missing URL if we didn't save it previously
                if (sessionUrl == null) {
                    sessionUrl = diditService.getSessionUrl(guide.getDiditSessionId());
                    if (sessionUrl != null) {
                        guide.setDiditSessionUrl(sessionUrl);
                        guideRepository.save(guide);
                    }
                }

                if (sessionUrl != null) {
                    return ResponseEntity.ok(Map.of(
                        "session_id", guide.getDiditSessionId(),
                        "url", sessionUrl
                    ));
                }
            }

            // Otherwise create a new session
            Map<String, String> sessionData = diditService.createSession(guide.getEmail());
            
            guide.setDiditSessionId(sessionData.get("session_id"));
            guide.setDiditSessionUrl(sessionData.get("url"));
            guideRepository.save(guide);
            
            return ResponseEntity.ok(sessionData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create verification session"));
        }
    }

    /**
     * Didit calls this webhook when a verification session status changes.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleDiditWebhook(@RequestBody Map<String, Object> payload) {
        // Ideally, you should verify the X-Signature-V2 header here for security
        
        String status = (String) payload.get("status");
        String vendorData = (String) payload.get("vendor_data"); // This is the guide's email we passed
        String webhookType = (String) payload.get("webhook_type");

        if (!"status.updated".equals(webhookType)) {
            return ResponseEntity.ok().build(); // Ignore other webhook types
        }

        if (vendorData == null || status == null) {
            return ResponseEntity.badRequest().build();
        }

        Optional<Guide> optionalGuide = guideRepository.findFirstByEmail(vendorData);
        if (optionalGuide.isPresent()) {
            Guide guide = optionalGuide.get();
            
            if ("Approved".equalsIgnoreCase(status)) {
                guide.setVerificationStatus(Guide.VerificationStatus.VERIFIED);
            } else if ("Declined".equalsIgnoreCase(status)) {
                guide.setVerificationStatus(Guide.VerificationStatus.REJECTED);
            }
            
            guideRepository.save(guide);
        }

        return ResponseEntity.ok().build(); // Acknowledge the webhook
    }

    /**
     * Fallback for local testing: Poll Didit for session status
     */
    @GetMapping("/status/{guideId}")
    public ResponseEntity<?> getVerificationStatus(@PathVariable Long guideId) {
        Optional<Guide> optionalGuide = guideRepository.findById(guideId);
        if (optionalGuide.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Guide guide = optionalGuide.get();
        if (guide.getDiditSessionId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "No active verification session"));
        }

        String status = diditService.getSessionStatus(guide.getDiditSessionId());
        if (status != null) {
            System.out.println("Didit Session Status: " + status);
            if ("Approved".equalsIgnoreCase(status) || "Verified".equalsIgnoreCase(status) || "Pass".equalsIgnoreCase(status) || "Accepted".equalsIgnoreCase(status)) {
                guide.setVerificationStatus(Guide.VerificationStatus.VERIFIED);
                guideRepository.save(guide);
            } else if ("Declined".equalsIgnoreCase(status) || "Rejected".equalsIgnoreCase(status) || "Fail".equalsIgnoreCase(status)) {
                guide.setVerificationStatus(Guide.VerificationStatus.REJECTED);
                guideRepository.save(guide);
            }
            Object verStatus = guide.getVerificationStatus() != null ? guide.getVerificationStatus() : "PENDING";
            return ResponseEntity.ok(Map.of("status", status, "verificationStatus", verStatus));
        }

        Object verStatus = guide.getVerificationStatus() != null ? guide.getVerificationStatus() : "PENDING";
        return ResponseEntity.ok(Map.of("verificationStatus", verStatus));
    }

    /**
     * Development endpoint to reset a guide's verification status
     */
    @PostMapping("/reset")
    public ResponseEntity<?> resetVerification(@RequestBody Map<String, Long> request) {
        Long guideId = request.get("guideId");
        if (guideId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "guideId is required"));
        }

        Optional<Guide> optionalGuide = guideRepository.findById(guideId);
        if (optionalGuide.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Guide guide = optionalGuide.get();
        guide.setDiditSessionId(null);
        guide.setDiditSessionUrl(null);
        guide.setVerificationStatus(null);
        guideRepository.save(guide);

        return ResponseEntity.ok(Map.of("message", "Verification reset successfully"));
    }
}
