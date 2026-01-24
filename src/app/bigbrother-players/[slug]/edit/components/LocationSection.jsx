"use client";

import { useState, useEffect, useRef } from "react";
import { FormSection, FormField } from "@/components/forms";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

/**
 * Location section with Google Places autocomplete
 */
export function LocationSection({ values, errors, setValue, onChange, onBlur, getFieldProps }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);

  // Load Google Places API
  useEffect(() => {
    if (!GOOGLE_API_KEY) {
      console.warn("Google Places API key not configured");
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Load script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup not needed - script persists
    };
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["(cities)"],
        fields: ["address_components", "geometry", "name"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();

        if (!place.address_components) return;

        let city = "";
        let state = "";
        let lat = "";
        let lng = "";

        // Extract city and state from address components
        for (const component of place.address_components) {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
        }

        // Get coordinates
        if (place.geometry?.location) {
          lat = place.geometry.location.lat().toString();
          lng = place.geometry.location.lng().toString();
        }

        // Update form values
        setValue("locality", city);
        setValue("administrative_area_level_1", state);
        setValue("lat", lat);
        setValue("lng", lng);
      });
    } catch (error) {
      console.error("Failed to initialize Places autocomplete:", error);
    }
  }, [isLoaded, setValue]);

  // Display value for autocomplete input
  const displayLocation = values.locality && values.administrative_area_level_1
    ? `${values.locality}, ${values.administrative_area_level_1}`
    : values.locality || values.administrative_area_level_1 || "";

  return (
    <FormSection
      title="Location"
      description="Player's hometown. Start typing to search for a city."
    >
      {GOOGLE_API_KEY ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Location
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Start typing a city name..."
              defaultValue={displayLocation}
              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a city from the dropdown to fill in the location fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="City"
              value={values.locality}
              onChange={onChange}
              onBlur={onBlur}
              name="locality"
              disabled
            />
            <FormField
              label="State"
              value={values.administrative_area_level_1}
              onChange={onChange}
              onBlur={onBlur}
              name="administrative_area_level_1"
              disabled
            />
          </div>
        </div>
      ) : (
        // Fallback: Manual entry if no API key
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="City"
            placeholder="e.g., Los Angeles"
            {...getFieldProps("locality")}
          />
          <FormField
            label="State"
            placeholder="e.g., CA"
            {...getFieldProps("administrative_area_level_1")}
          />
        </div>
      )}
    </FormSection>
  );
}
