import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

export interface MapLocation {
  address: string;
  lat: number;
  lng: number;
}

// Fix leaflet default marker icon path issue with webpack
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

@Component({
  selector: 'app-map-picker',
  templateUrl: './map-picker.component.html',
  styleUrls: ['./map-picker.component.scss'],
})
export class MapPickerComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  /** Adresse initiale (mode édition) */
  @Input() initialAddress = '';
  @Input() initialLat: number | null = null;
  @Input() initialLng: number | null = null;

  /** Émis à chaque pin posé */
  @Output() locationSelected = new EventEmitter<MapLocation>();

  searchQuery = '';
  searchResults: any[] = [];
  searching = false;
  selectedAddress = '';

  private map!: L.Map;
  private marker: L.Marker | null = null;

  ngOnInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;
    if (
      (changes['initialLat'] || changes['initialLng']) &&
      this.initialLat != null &&
      this.initialLng != null
    ) {
      this.placeMarker(this.initialLat, this.initialLng, this.initialAddress);
      this.map.setView([this.initialLat, this.initialLng], 13);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    const lat = this.initialLat ?? 36.8189;
    const lng = this.initialLng ?? 10.1658;
    const zoom = this.initialLat ? 13 : 6;

    this.map = L.map(this.mapContainer.nativeElement, { zoomControl: true }).setView(
      [lat, lng],
      zoom
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.initialLat != null && this.initialLng != null) {
      this.placeMarker(this.initialLat, this.initialLng, this.initialAddress);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  async search(): Promise<void> {
    if (!this.searchQuery.trim()) return;
    this.searching = true;
    this.searchResults = [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        this.searchQuery
      )}&limit=5&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      this.searchResults = await res.json();
    } catch {
      this.searchResults = [];
    } finally {
      this.searching = false;
    }
  }

  selectResult(result: any): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;
    this.placeMarker(lat, lng, address);
    this.map.setView([lat, lng], 15);
    this.searchResults = [];
    this.searchQuery = '';
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const data = await res.json();
      const address = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      this.placeMarker(lat, lng, address);
    } catch {
      this.placeMarker(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }

  private placeMarker(lat: number, lng: number, address: string): void {
    if (this.marker) {
      this.marker.remove();
    }
    this.marker = L.marker([lat, lng], { icon: iconDefault })
      .addTo(this.map)
      .bindPopup(address)
      .openPopup();
    this.selectedAddress = address;
    this.locationSelected.emit({ address, lat, lng });
  }

  onSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.search();
    }
  }
}
