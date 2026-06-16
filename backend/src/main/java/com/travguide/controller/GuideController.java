package com.travguide.controller;

import com.travguide.model.Guide;
import com.travguide.model.GuidePost;
import com.travguide.repository.GuideRepository;
import com.travguide.repository.GuidePostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/guides")
@CrossOrigin(origins = "*")
public class GuideController {

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private GuidePostRepository guidePostRepository;

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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGuide(@PathVariable Long id, @RequestBody Guide updatedGuide) {
        return guideRepository.findById(id).map(guide -> {
            if (updatedGuide.getCity() != null) guide.setCity(updatedGuide.getCity());
            if (updatedGuide.getBio() != null) guide.setBio(updatedGuide.getBio());
            if (updatedGuide.getPricePerDay() != null) guide.setPricePerDay(updatedGuide.getPricePerDay());
            if (updatedGuide.getLatitude() != null) guide.setLatitude(updatedGuide.getLatitude());
            if (updatedGuide.getLongitude() != null) guide.setLongitude(updatedGuide.getLongitude());
            if (updatedGuide.getIdProofType() != null) guide.setIdProofType(updatedGuide.getIdProofType());
            if (updatedGuide.getIdProofNumber() != null) guide.setIdProofNumber(updatedGuide.getIdProofNumber());
            if (updatedGuide.getMobileNumber() != null) guide.setMobileNumber(updatedGuide.getMobileNumber());
            if (updatedGuide.getDateOfBirth() != null) guide.setDateOfBirth(updatedGuide.getDateOfBirth());
            if (updatedGuide.getGender() != null) guide.setGender(updatedGuide.getGender());
            if (updatedGuide.getTripDurationDays() != null) guide.setTripDurationDays(updatedGuide.getTripDurationDays());
            if (updatedGuide.getLocationsShown() != null) guide.setLocationsShown(updatedGuide.getLocationsShown());
            if (updatedGuide.getServicesProvided() != null) guide.setServicesProvided(updatedGuide.getServicesProvided());
            return ResponseEntity.ok(guideRepository.save(guide));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Guide> searchGuides(@RequestParam String city) {
        return guideRepository.findByCityContainingIgnoreCase(city);
    }

    @GetMapping("/by-email")
    public ResponseEntity<?> getGuideByEmail(@RequestParam String email) {
        return guideRepository.findFirstByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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

    // Serve uploaded files
    @GetMapping("/files/{subDir}/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String subDir, @PathVariable String fileName) {
        try {
            Path file = Paths.get(uploadDir).resolve(subDir).resolve(fileName).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // Upload profile picture
    @PostMapping("/{id}/upload-profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return guideRepository.findById(id).map(guide -> {
            try {
                String fileName = saveFile(file, "profile-pictures");
                guide.setProfilePictureUrl(fileName);
                guideRepository.save(guide);
                return ResponseEntity.ok(Map.of("message", "Profile picture uploaded", "fileName", fileName));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Upload a new post to gallery (Instagram style - multiple images, tags, captions)
    @PostMapping("/{id}/posts")
    public ResponseEntity<?> createPost(
            @PathVariable Long id, 
            @RequestParam("files") MultipartFile[] files, 
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "tags", required = false) String tags) {
            
        return guideRepository.findById(id).map(guide -> {
            try {
                StringBuilder imageUrlsBuilder = new StringBuilder();
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;
                    String fileName = saveFile(file, "gallery-posts");
                    if (imageUrlsBuilder.length() > 0) imageUrlsBuilder.append(",");
                    imageUrlsBuilder.append(fileName);
                }
                
                if (imageUrlsBuilder.length() == 0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "At least one image is required"));
                }
                
                GuidePost post = new GuidePost();
                post.setGuide(guide);
                post.setImageUrls(imageUrlsBuilder.toString());
                if (caption != null) post.setCaption(caption);
                if (location != null) post.setLocation(location);
                if (tags != null) post.setTags(tags);
                
                guidePostRepository.save(post);
                return ResponseEntity.ok(Map.of("message", "Post created successfully", "postId", post.getId()));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Get all gallery posts for a guide
    @GetMapping("/{id}/posts")
    public ResponseEntity<List<GuidePost>> getPosts(@PathVariable Long id) {
        List<GuidePost> posts = guidePostRepository.findByGuideIdOrderByCreatedAtDesc(id);
        return ResponseEntity.ok(posts);
    }

    // Like a post
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<?> likePost(@PathVariable Long postId) {
        return guidePostRepository.findById(postId).map(post -> {
            post.setLikesCount(post.getLikesCount() + 1);
            guidePostRepository.save(post);
            return ResponseEntity.ok(Map.of("likesCount", post.getLikesCount()));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete a gallery post
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId) {
        return guidePostRepository.findById(postId).map(post -> {
            guidePostRepository.delete(post);
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Edit a gallery post (caption, location, tags)
    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> editPost(
            @PathVariable Long postId,
            @RequestBody Map<String, String> payload) {
            
        return guidePostRepository.findById(postId).map(post -> {
            if (payload.containsKey("caption")) post.setCaption(payload.get("caption"));
            if (payload.containsKey("location")) post.setLocation(payload.get("location"));
            if (payload.containsKey("tags")) post.setTags(payload.get("tags"));
            guidePostRepository.save(post);
            return ResponseEntity.ok(post);
        }).orElse(ResponseEntity.notFound().build());
    }

    // Upload destination images
    @PostMapping("/{id}/upload-destination-images")
    public ResponseEntity<?> uploadDestinationImages(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        return guideRepository.findById(id).map(guide -> {
            try {
                StringBuilder newImages = new StringBuilder();
                if (guide.getDestinationImages() != null && !guide.getDestinationImages().isEmpty()) {
                    newImages.append(guide.getDestinationImages());
                }
                for (MultipartFile file : files) {
                    if (file.isEmpty()) continue;
                    String fileName = saveFile(file, "destinations");
                    if (newImages.length() > 0) newImages.append(",");
                    newImages.append(fileName);
                }
                guide.setDestinationImages(newImages.toString());
                guideRepository.save(guide);
                return ResponseEntity.ok(Map.of("message", "Images uploaded successfully", "destinationImages", guide.getDestinationImages()));
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete a specific destination image
    @DeleteMapping("/{id}/destination-images")
    public ResponseEntity<?> deleteDestinationImage(@PathVariable Long id, @RequestParam("fileName") String fileName) {
        return guideRepository.findById(id).map(guide -> {
            if (guide.getDestinationImages() != null) {
                String[] images = guide.getDestinationImages().split(",");
                StringBuilder updatedImages = new StringBuilder();
                for (String img : images) {
                    if (!img.equals(fileName)) {
                        if (updatedImages.length() > 0) updatedImages.append(",");
                        updatedImages.append(img);
                    }
                }
                guide.setDestinationImages(updatedImages.toString());
                guideRepository.save(guide);
            }
            return ResponseEntity.ok(Map.of("message", "Image removed", "destinationImages", guide.getDestinationImages() == null ? "" : guide.getDestinationImages()));
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
