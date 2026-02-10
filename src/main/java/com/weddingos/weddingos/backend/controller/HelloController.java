package com.weddingos.weddingos.backend.controller;

import com.weddingos.weddingos.backend.dto.Hello;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.atomic.AtomicLong;

@RestController
public class HelloController {
    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();


    @GetMapping("/hello")
    public Hello hello(@RequestParam(defaultValue = "WeddingOS") String name){
        return new Hello(counter.incrementAndGet(), template.formatted(name));
    }
}
