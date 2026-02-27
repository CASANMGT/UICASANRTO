# Migration Parity Checklist

Use this checklist before and after each migration phase.

## Navigation And Boot

- [ ] App loads without fatal errors in browser console
- [ ] Sidebar tab switching works for Users, Programs, Applications, Renter, Finance, Vehicles, Maps, GPS
- [ ] Partner selector updates visible tab data consistently
- [ ] Stats bar context switches correctly per active tab

## Users

- [ ] Search filters by name, phone, and NIK
- [ ] Risk/program filters produce expected row counts
- [ ] Sort behavior is stable and reversible

## Vehicles

- [ ] Search and status filters produce expected results
- [ ] Pagination works and stays in range after filtering
- [ ] Vehicle actions do not throw errors

## Finance

- [ ] Program filter updates summary cards and transaction rows
- [ ] Pagination updates transaction table correctly
- [ ] Partner filter cross-updates finance totals

## Map

- [ ] Map initializes and renders markers
- [ ] Marker counts match current filtered fleet
- [ ] Status filters affect map and list consistently
- [ ] Vehicle focus from list highlights expected marker

## GPS

- [ ] GPS list renders and filters by status/search/brand
- [ ] Add/edit/delete flows update list correctly

## RTO

- [ ] RTO tabs switch correctly (Applications, Pickup, Score, WA)
- [ ] Score config persists across reloads (`casan_rto_cfg`)
- [ ] WA template config persists across reloads (`csn_wa_cfg`)

## Performance

- [ ] 3-second movement simulation loop continues without lock-ups
- [ ] No memory growth spikes during repeated tab switches
