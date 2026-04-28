package com.travguide.controller;

import com.travguide.model.Guide;
import com.travguide.repository.GuideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/guides")
@CrossOrigin(origins = "*")
public class GuideController {

    @Autowired
    private GuideRepository guideRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping
    public List<Guide> getAllGuides() {
        return guideRepository.findAll();
    }

    @PostMapping
    public Guide createGuide(@RequestBody Guide guide) {
        guide.setVerificationStatus(Guide.VerificationStatus.PENDING);
        if (guide.getRating() == null) {
            guide.setRating(5.0);
        }
        return guideRepository.save(guide);
    }

    @GetMapping("/search")
    public List<Guide> searchGuides(@RequestParam String city) {
        return guideRepository.findByCityContainingIgnoreCase(city);
    }

    // Upload ID Proof document
    @PostMapping("/{id}/upload-id")
    public ResponseEntity<?> uploadIdProof(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return guideRepository.findById(id).map(guide -> {
            try {
                String fileName = saveFile(file, "id-proofs");
                guide.setIdProofUrl(fileName);
                guideRepository.save(guide);
                return ResponseEntity.ok(Map.of("message", "ID proof uploaded", "fileName", fileName));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Upload selfie for face verification
    @PostMapping("/{id}/upload-selfie")
    public ResponseEntity<?> uploadSelfie(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return guideRepository.findById(id).map(guide -> {
            try {
                String fileName = saveFile(file, "selfies");
                guide.setSelfieUrl(fileName);
                guideRepository.save(guide);
                return ResponseEntity.ok(Map.of("message", "Selfie uploaded", "fileName", fileName));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Admin: Verify or reject a guide
    @PatchMapping("/{id}/verify")
    public ResponseEntity<?> verifyGuide(@PathVariable Long id, @RequestParam String status) {
        return guideRepository.findById(id).map(guide -> {
            guide.setVerificationStatus(Guide.VerificationStatus.valueOf(status.toUpperCase()));
            guideRepository.save(guide);
            return ResponseEntity.ok(guide);
        }).orElse(ResponseEntity.notFound().build());
    }

    private String saveFile(MultipartFile file, String subDir) throws IOException {
        Path uploadPath = Paths.get(uploadDir, subDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return subDir + "/" + fileName;
    }
}
