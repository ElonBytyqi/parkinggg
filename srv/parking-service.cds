using parking from '../db/schema';

service ParkingService {
  entity Zones         as projection on parking.Zones;
  entity Spots         as projection on parking.Spots;
  entity CreditWallets as projection on parking.CreditWallets;

  action toggleStatus(ID: UUID)                          returns Spots;

  action reserveSpot(ID: UUID,
                     plate: String,
                     hours: Integer,
                     amount: Decimal(9, 2),
                     credits: Integer,
                     paymentMethod: String)              returns Spots;

  action releaseSpot(ID: UUID)                           returns Spots;
  action deductCredits(ID: UUID, amountCredits: Integer) returns CreditWallets;

}
