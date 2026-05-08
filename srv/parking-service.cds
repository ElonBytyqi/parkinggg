using parking from '../db/schema';

service ParkingService {
  entity Zones as projection on parking.Zones;
  entity Spots as projection on parking.Spots;
  action toggleStatus(ID: UUID) returns Spots;
}
