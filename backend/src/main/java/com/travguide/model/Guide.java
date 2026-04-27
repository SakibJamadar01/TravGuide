package com.travguide.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "guides")
@Data // This automatically adds getters and setters
public class Guide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String city;
    
    @Column(length = 1000)
    private String bio;
    
    private Double pricePerDay;
    private Double rating;
    private Double latitude;
private Double longitude;

}
