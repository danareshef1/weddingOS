package com.weddingos.weddingos.backend.service;

import com.weddingos.weddingos.backend.dto.GuestResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class GuestService {
    public List<GuestResponse> guests = new ArrayList<>();
    AtomicLong id = new AtomicLong(0);

    public List<GuestResponse> getGuests(){
        return guests;
    }

    public GuestResponse addGuests(GuestResponse guest){
        guests.add(guest);
        long newId = id.incrementAndGet();
        return guest;
    }

    public void deleteGuest(long id){
        guests.removeIf(guest -> guest.id() == id);
    }
}
