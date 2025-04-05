import WorldCameraFinderProvider from "../SpectaclesInteractionKit/Providers/CameraProvider/WorldCameraFinderProvider";
import { LensConfig } from "../SpectaclesInteractionKit/Utils/LensConfig";

@component
export class NorthIndicator extends BaseScriptComponent {
  @input
  public text: string = "N";

  private cameraTransform: Transform;
  private updateDispatcher = LensConfig.getInstance().updateDispatcher;

  onAwake() {
    this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
  }

  private onStart() {
    this.cameraTransform = WorldCameraFinderProvider.getInstance().getTransform();
    const textComponent = this.sceneObject.getComponent("Component.Text");
    if (textComponent) {
      textComponent.text = this.text;
      (textComponent as any).FontSize = 24;
    }
    
    const updateEvent = this.updateDispatcher.createUpdateEvent("UpdateEvent");
    updateEvent.bind(this.onUpdate.bind(this));
  }

  private onUpdate() {
    const textComponent = this.sceneObject.getComponent("Component.Text");
    if (!textComponent) return;
    
    // Get camera's forward direction in world space
    const forward = this.cameraTransform.forward;
    
    // Calculate angle between forward vector and north (negative Z-axis)
    const angle = Math.atan2(-forward.x, -forward.z) * (180 / Math.PI);
    
    // Rotate the N indicator to always point north
    textComponent.getTransform().setLocalRotation(
      quat.angleAxis(-angle, vec3.up())
    );
  }
} 