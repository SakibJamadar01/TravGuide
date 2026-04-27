package com.travguide.repository;

import com.travguide.model.Guide;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuideRepository extends JpaRepository<Guide, Long> {
    List<Guide> findByCityContainingIgnoreCase(String city);

}
