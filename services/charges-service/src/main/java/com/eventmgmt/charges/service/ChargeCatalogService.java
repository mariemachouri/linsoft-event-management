package com.eventmgmt.charges.service;

import com.eventmgmt.charges.model.ChargeCategory;
import com.eventmgmt.charges.model.ChargeCatalogItem;
import com.eventmgmt.charges.repository.ChargeCatalogRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ChargeCatalogService {

    @Inject
    ChargeCatalogRepository repository;

    /**
     * Pré-peuple le catalogue au démarrage si vide
     */
    void onStart(@Observes StartupEvent ev) {
        if (repository.count() == 0) {
            initializeCatalog();
        }
    }

    private void initializeCatalog() {
        String now = LocalDateTime.now().toString();
        Object[][] items = {
            {"Stylo",              "Stylo bille standard",                   ChargeCategory.SUPPLIES,       "pièce",   0.5},
            {"PC Portable",        "Ordinateur portable pour les sessions",   ChargeCategory.EQUIPMENT,      "pièce",   800.0},
            {"Projecteur",         "Vidéoprojecteur HD",                      ChargeCategory.EQUIPMENT,      "pièce",   150.0},
            {"Table",              "Table pliante de réunion",                ChargeCategory.VENUE,          "pièce",   30.0},
            {"Chaise",             "Chaise empilable standard",               ChargeCategory.VENUE,          "pièce",   8.0},
            {"Câble HDMI",         "Câble HDMI 2m",                          ChargeCategory.EQUIPMENT,      "pièce",   12.0},
            {"Microphone",         "Microphone sans fil",                     ChargeCategory.EQUIPMENT,      "pièce",   80.0},
            {"Sonorisation",       "Système de sonorisation complet",         ChargeCategory.EQUIPMENT,      "forfait", 350.0},
            {"Restauration",       "Café/viennoiseries par personne",         ChargeCategory.CATERING,       "pièce",   12.0},
            {"Repas",              "Repas complet par personne",              ChargeCategory.CATERING,       "pièce",   35.0},
            {"Salle de conférence","Location salle par heure",                ChargeCategory.VENUE,          "heure",   120.0},
            {"Badges visiteurs",   "Badge nominatif imprimé",                 ChargeCategory.SUPPLIES,       "pièce",   2.0},
            {"Bannière publicitaire","Bannière roll-up",                      ChargeCategory.MARKETING,      "pièce",   90.0},
            {"Personnel accueil",  "Agent d'accueil par heure",               ChargeCategory.STAFFING,       "heure",   18.0},
            {"Assurance événement","Assurance responsabilité civile forfait", ChargeCategory.INSURANCE,      "forfait", 200.0},
        };

        for (Object[] row : items) {
            var item = new ChargeCatalogItem();
            item.name             = (String) row[0];
            item.description      = (String) row[1];
            item.category         = (ChargeCategory) row[2];
            item.unit             = (String) row[3];
            item.defaultUnitPrice = (Double) row[4];
            item.currency         = "EUR";
            item.active           = true;
            item.createdAt        = now;
            item.updatedAt        = now;
            repository.persist(item);
        }
    }

    public List<ChargeCatalogItem> listAll() {
        return repository.listAll();
    }

    public List<ChargeCatalogItem> listActive() {
        return repository.find("active", true).list();
    }

    public Optional<ChargeCatalogItem> findById(String id) {
        return repository.findByIdOptional(new ObjectId(id));
    }

    public ChargeCatalogItem create(ChargeCatalogItem item) {
        String now = LocalDateTime.now().toString();
        item.createdAt = now;
        item.updatedAt = now;
        if (item.currency == null) item.currency = "EUR";
        item.active = true;
        repository.persist(item);
        return item;
    }

    public Optional<ChargeCatalogItem> update(String id, ChargeCatalogItem updated) {
        return repository.findByIdOptional(new ObjectId(id)).map(existing -> {
            if (updated.name != null)             existing.name = updated.name;
            if (updated.description != null)      existing.description = updated.description;
            if (updated.category != null)         existing.category = updated.category;
            if (updated.unit != null)             existing.unit = updated.unit;
            if (updated.defaultUnitPrice > 0)     existing.defaultUnitPrice = updated.defaultUnitPrice;
            if (updated.currency != null)         existing.currency = updated.currency;
            existing.active    = updated.active;
            existing.updatedAt = LocalDateTime.now().toString();
            repository.update(existing);
            return existing;
        });
    }

    public boolean delete(String id) {
        return repository.deleteById(new ObjectId(id));
    }
}
