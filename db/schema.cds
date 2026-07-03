namespace parking;

entity Zones {
  key ID    : UUID;
      name  : String(50);
      code  : String(20);
      spots : Composition of many Spots
                on spots.zone = $self;
}

entity Spots {
  key ID            : UUID;
      zone          : Association to Zones;
      number        : Integer;
      status        : String(10);
      updatedAt     : Timestamp;

      plate         : String(20);
      reservedHours : Integer;
      amount        : Decimal(9, 2);
      credits       : Integer;
      paymentMethod : String(20);
      expiresAt     : Timestamp;
}

entity CreditWallets {
  key ID            : UUID;
      owner         : String(50);
      creditBalance : Integer;
      updatedAt     : Timestamp;
}
