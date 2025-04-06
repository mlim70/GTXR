import { LensConfig } from "../../SpectaclesInteractionKit/Utils/LensConfig";
import { UpdateDispatcher } from "../../SpectaclesInteractionKit/Utils/UpdateDispatcher";

@component
export class TimeDisplayController extends BaseScriptComponent {
  @input
  textComponent: Text;

  private updateDispatcher: UpdateDispatcher = LensConfig.getInstance().updateDispatcher;

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
  }

  private onStart() {
    const updateEvent = this.updateDispatcher.createUpdateEvent("UpdateEvent");
    updateEvent.bind(this.onUpdate.bind(this));
  }

  private onUpdate() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Format time as HH:MM with leading zeros
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    if (this.textComponent) {
      this.textComponent.text = formattedTime;
    }
  }
} 