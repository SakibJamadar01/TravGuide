package com.travguide.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "guide_posts")
@Data
public class GuidePost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String imageUrls; // Comma-separated list of image filenames

    @Column(length = 2000)
    private String caption;

    @Column(length = 500)
    private String location;

    @Column(length = 1000)
    private String tags; // Comma-separated list of tags

    private int likesCount = 0;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Guide guide;
}
