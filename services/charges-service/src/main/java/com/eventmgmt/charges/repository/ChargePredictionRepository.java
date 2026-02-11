package com.eventmgmt.charges.repository;

import com.eventmgmt.charges.model.ChargePrediction;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ChargePredictionRepository implements PanacheMongoRepository<ChargePrediction> {
}