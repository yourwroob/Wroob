import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";

interface LocationCaptureProps {
  onCapture: (lat: number, lng: number) => void;
  captured?: boolean;
}

const LocationCapture = ({ onCapture, captured }: LocationCaptureProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onCapture(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === 1
            ? "Location access denied. Please enable it in your browser settings."
            : "Could not get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (captured) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        Location captured — you'll be added to a local community group.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleRequest}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {loading ? "Getting location..." : "Enable Location for Local Groups"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Your precise location is never shared. We only use it to find students near you.
      </p>
    </div>
  );
};

export default LocationCapture;
