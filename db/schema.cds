namespace parking;

entity Zones {
  key ID   : UUID;
  name     : String(50);
  code     : String(20);
  spots    : Composition of many Spots on spots.zone = $self;
}

entity Spots {
  key ID        : UUID;
  zone          : Association to Zones;
  number        : Integer;
  status        : String(10);   // FREE or OCCUPIED
  updatedAt     : Timestamp;
}
