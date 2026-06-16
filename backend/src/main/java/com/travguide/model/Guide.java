package com.travguide.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "guides")
@Data // This automatically adds getters and setters
public class Guide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Step 1: Identity Information
    private String name;
    private String email;
    private LocalDate dateOfBirth;
    private String gender;
    private String mobileNumber;

    // Step 2: Document Verification
    private String idProofType; // AADHAAR, PAN, PASSPORT
    private String idProofNumber;

    @Column(length = 500)
    private String idProofUrl; // File path for uploaded ID proof

    @Column(length = 500)
    private String selfieUrl; // File path for uploaded selfie

    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    private String diditSessionId;

    @Column(length = 1000)
    private String diditSessionUrl;

    // Step 3: Guide Profile
    private String city;

    @Column(length = 1000)
    private String bio;

    private Double pricePerDay;
    private Double rating;
    private Double latitude;
    private Double longitude;

    // Step 4: Trip & Service Details
    private Integer tripDurationDays;
    
    @Column(length = 1000)
    private String locationsShown;
    
    @Column(length = 1000)
    private String servicesProvided;

    @Column(length = 500)
    private String profilePictureUrl;

    @Column(length = 2000)
    private String destinationImages; // comma separated file URLs

    public enum VerificationStatus {
        PENDING,
        VERIFIED,
        REJECTED
    }
}
