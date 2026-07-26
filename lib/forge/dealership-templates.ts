export interface ForgeDealershipTemplate {
  id: string
  title: string
  category: "Dealership" | "Service" | "Financing"
  tagline: string
  prompt: string
  previewImage?: string
}

export const DEALERSHIP_SEED_TEMPLATES: ForgeDealershipTemplate[] = [
  {
    id: "inventory-showcase",
    title: "Dealership Inventory & Financing Funnel",
    category: "Dealership",
    tagline: "High-converting used & new auto sales showcase with instant credit pre-qual CTA.",
    prompt: "Build a high-converting auto dealership landing page for Rodriguez Auto Sales featuring a featured vehicle inventory showcase, instant financing pre-qualification form, customer testimonials, and an urgent test-drive booking CTA."
  },
  {
    id: "financing-prequal",
    title: "Fast Pre-Qual Credit Funnel",
    category: "Financing",
    tagline: "Multi-step credit application funnel with instant approval routing.",
    prompt: "Build a 3-step auto financing pre-qualification funnel with income selection, desired monthly payment slider, SSN last 4 digits capture, and instant thank-you confirmation."
  },
  {
    id: "service-booking",
    title: "Express Auto Service & Repair Booking",
    category: "Service",
    tagline: "Oil change, brake service & inspection appointment booking funnel.",
    prompt: "Build an express vehicle service appointment booking page with vehicle make/model dropdown, service package selection (Oil Change, Brake Inspection, Full Detail), and calendar time picker."
  },
  {
    id: "tradein-estimator",
    title: "Instant Vehicle Trade-In Valuation",
    category: "Dealership",
    tagline: "2-minute instant trade-in value estimator with photo upload.",
    prompt: "Build a vehicle trade-in valuation landing page where vehicle owners enter VIN or Year/Make/Model, mileage, vehicle condition rating, and receive an instant estimated trade-in offer."
  }
]
