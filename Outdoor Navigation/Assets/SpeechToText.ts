import { MapComponent } from "./MapComponent/Scripts/MapComponent";

@component
export class SpeechToText extends BaseScriptComponent {
    
  @input()
  text: Text;

  @input() 
  remoteServiceModule: RemoteServiceModule;

  @input()
  mapComponent: MapComponent;

  // Remote service module for fetching data
  private voiceMLModule: VoiceMLModule = require("LensStudio:VoiceMLModule");
  private isEnabled: boolean = false;

  onAwake() {
    let options = VoiceML.ListeningOptions.create();
    options.shouldReturnAsrTranscription = true;
    options.shouldReturnInterimAsrTranscription = true;
    this.voiceMLModule.onListeningEnabled.add(() => {
      this.voiceMLModule.startListening(options);
      this.voiceMLModule.onListeningUpdate.add(this.onListenUpdate);
    });
  }

  containsActivation(payload: string): boolean {
    payload = payload.toLowerCase();
    const heyIndex = payload.indexOf('hey');
    const nameIndex = payload.indexOf('alice');
    print(payload);
    return (heyIndex != -1) && (nameIndex != -1) && (heyIndex < nameIndex);
  }

  async queryGemini(instructions: string) {
    const categories = ["accounting", "airport", "amusement_park", "aquarium", "art_gallery", "atm", 
      "bakery", "bank", "bar", "beauty_salon", "bicycle_store", "book_store", "bowling_alley", "bus_station", 
      "cafe", "campground", "car_dealer", "car_rental", "car_repair", "car_wash", "casino", "cemetery", "church", 
      "city_hall", "clothing_store", "convenience_store", "courthouse", "dentist", "department_store", "doctor", 
      "drugstore", "electrician", "electronics_store", "embassy", "fire_station", "florist", "funeral_home", "furniture_store", 
      "gas_station", "gym", "hair_care", "hardware_store", "hindu_temple", "home_goods_store", "hospital", "insurance_agency", 
      "jewelry_store", "laundry", "lawyer", "library", "light_rail_station", "liquor_store", "local_government_office", "locksmith", 
      "lodging", "meal_delivery", "meal_takeaway", "mosque", "movie_rental","movie_theater", "moving_company", "museum", "night_club", 
      "painter", "park", "parking", "pet_store", "pharmacy", "physiotherapist", "plumber", "police", "post_office", "primary_school", 
      "real_estate_agency", "restaurant", "roofing_contractor", "rv_park", "school", "secondary_school", "shoe_store", "shopping_mall", 
      "spa", "stadium", "storage", "store","subway_station","supermarket", "synagogue", "taxi_stand", "tourist_attraction", "train_station", 
      "transit_station", "travel_agency", "university", "veterinary_care", "zoo" ];
    const prompt = `Given this user query [${instructions}] which of these categories is the user looking for? ${categories.join(', ')}. Output a comma separated list.`;
    const gemini_api_key = 'AIzaSyAZvjI98_CY3XPnVlPgCuI0Z3i3YgehhZ0';
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gemini_api_key}`;
    const request = new Request(geminiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "contents": [{
          "parts": [{
            "text": prompt,
          }],
          "role": "user"
        }],
      })
    });
    const response = await this.remoteServiceModule.fetch(request);
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    const data = await response.json();
    const responseCategories = (data['candidates'][0]['content']['parts'][0]['text']);
    const categoriesOutput = responseCategories.includes(',') ? responseCategories.split(',') : [];

    const placesRequest = new Request("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=51.5072,0.1276&radius=500&key=AIzaSyB7wSe9y3D-u4FMAPjl5TXupnSGh5eV3IU", {
      method: "GET"
    });
    
    const placesResponse = await this.remoteServiceModule.fetch(placesRequest);
    if (!placesResponse.ok) {
        throw new Error("HTTP error " + placesResponse.status);
    }
    const placesData = await placesResponse.json();
    return { 'categories': categoriesOutput, 'locations': placesData };
  }

  onListenUpdate = (eventData: VoiceML.ListeningUpdateEventArgs) => {
    print('onListenUpdate');
    if (eventData.isFinalTranscription) {
      if (!this.isEnabled) {
        this.isEnabled = this.containsActivation(eventData.transcription);
      } else {
        this.queryGemini(this.text.text).then(output => {
          const categories = output['categories'];
          const locations = output['locations']['results'];
          const nSamples = 16;
          for (let i = 0; i < nSamples; i += 1) {
            const index = Math.floor(Math.random() * locations.length);
            const location = locations[index]['geometry']['location'];
            this.mapComponent.createMapPin(location['lng'], location['lat']);
          }
        });
        this.isEnabled = false;
        this.text.text = '';
      }
    }
    
    if (this.isEnabled) {
      this.text.text = eventData.transcription;
    }
  };
}