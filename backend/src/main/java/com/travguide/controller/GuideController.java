package com.travguide.controller;



import com.travguide.model.Guide;
import com.travguide.repository.GuideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guides")
@CrossOrigin(origins = "*")
public class GuideController {

    @Autowired
    private GuideRepository guideRepository;

    @GetMapping
    public List<Guide> getAllGuides() {
        return guideRepository.findAll();
    }

    @PostMapping
    public Guide createGuide(@RequestBody Guide guide) {
        return guideRepository.save(guide);
    }

    @GetMapping("/search")
public List<Guide> searchGuides(@RequestParam String city) {
    return guideRepository.findByCityContainingIgnoreCase(city);
}

}
