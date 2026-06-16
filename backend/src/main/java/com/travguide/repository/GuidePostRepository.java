package com.travguide.repository;

import com.travguide.model.GuidePost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuidePostRepository extends JpaRepository<GuidePost, Long> {
    List<GuidePost> findByGuideIdOrderByCreatedAtDesc(Long guideId);
}
