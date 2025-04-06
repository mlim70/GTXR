import { NEARBY_PLACES_LIMIT } from "../MapComponent/Scripts/PlacesConfig";


interface PlaceIdentificationResult {
    success: boolean;
    identified_place: string | null;
    possible_places: string[];
    error?: string;
}


@component
export class  Handler extends BaseScriptComponent {
    // Expose an Image component via Lens input.
    @input imageComponent: Image;
    // Expose the RemoteServiceModule via Lens input.
    @input remoteServiceModule: RemoteServiceModule;

    // SnapPlacesController.js
    private PlacesAPI: any;

    onAwake() {
        // load your JS wrapper
//        this.PlacesAPI = require("./SnapPlacesController.js");
    
        // TODO: replace these dummy coords with real GPS
        const lat = 51.5072;
        const lng = 0.1276;
    
        // now choosePlace will fetch nearby places internally
      }

    // choosePlace now takes possible_places and location as inputs.
    async choosePlace(lat: number, lng: number): Promise<PlaceIdentificationResult> {
        try {
            // Convert the image texture to a Base64 string using the asynchronous API.
            const base64Image = await this.ImageToBase64(this.imageComponent);
            
           const placesRequest = new Request("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=51.5072,0.1276&radius=500&key=AIzaSyB7wSe9y3D-u4FMAPjl5TXupnSGh5eV3IU", {
               method: "GET",
            });
            
            const placesResponse = await this.remoteServiceModule.fetch(placesRequest);
            if (!placesResponse.ok) {
                throw new Error("HTTP error " + placesResponse.status);
            }
            const placesData = await placesResponse.json();
            // print("Places data: " + JSON.stringify(placesData));

            const places = placesData.results ?? [];
            if (places.length === 0) {
                print("No nearby places found; aborting choosePlace.");
                return {
                    success: false,
                    identified_place: null,
                    possible_places: [],
                    error: "No nearby places found"
                };
            }
            
            // Extract just the names from the places
            const possible_places = places.map(place => place.name);
            // print("Place names: " + JSON.stringify(possible_places));
            const requestPayload = {
                image_data: base64Image,
                possible_places: possible_places,
                location: { lat, lng }
            };
            // Create a Request object for the POST call.
            const request = new Request("https://gtxr-flask-7c107d1c5356.herokuapp.com/identify-place", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestPayload)
            });


            // Use RemoteServiceModule's fetch method.
            const response = await this.remoteServiceModule.fetch(request);
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            const data = await response.json();
            print("Response received: " + JSON.stringify(data));
            return response.json();
        } catch (error) {
            print("Error in choosePlace: " + error);
        }
    }

    // ImageToBase64 converts an Image's texture to a Base64 string.
    ImageToBase64(img: Image): Promise<string> {
        return new Promise((resolve, reject) => {
            const texture = img.mainPass.baseTex;
            Base64.encodeTextureAsync(
                texture,
                resolve,
                reject,
                CompressionQuality.LowQuality,
                EncodingType.Png
            );
        });
    }
    
    /**
     * Generates a description for a specific place using the Gemini API
     * @param placeName The name of the place to describe
     * @param mapsInfo Additional map information about the place
     * @returns Promise with the generated description
     */
    async generatePlaceDescription(placeName: string, mapsInfo: any): Promise<string> {
        try {
            // Create a payload for the request
            const requestPayload = {
                place_name: placeName,
                maps_info: mapsInfo
            };

            // Create a Request object for the POST call
            const request = new Request("https://gtxr-flask-7c107d1c5356.herokuapp.com/generate-place-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestPayload)
            });

            // Use RemoteServiceModule's fetch method
            const response = await this.remoteServiceModule.fetch(request);
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            
            const data = await response.json();
            print("Description received: " + JSON.stringify(data));
            
            // Return the description from the response
            if (data.success) {
                return data.description || "No description available.";
            } else {
                throw new Error(data.error || "Unknown error generating description");
            }
        } catch (error) {
            print("Error generating place description: " + error);
            return "Could not generate description due to an error.";
        }
    }
}