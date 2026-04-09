

# Uzupełnienie cen dla 2 dań typu PIECE

## Co zostało zrobione
Wstawiłem 10 testowych dań do bazy w różnych kategoriach:

| Danie | Kategoria | Typ | Cena |
|-------|-----------|-----|------|
| Rosołek tradycyjny | 🍲 Zupy | os. | 18 zł |
| Krem z pomidorów | 🍲 Zupy | os. | 16 zł |
| Polędwica wołowa sous-vide | 🥩 Dania główne | os. | 65 zł |
| Pierogi ruskie | 🥩 Dania główne | os. | 28 zł |
| Sałatka Cezar | 🥗 Sałatki | os. | 22 zł |
| Tarta cytrynowa z bezą | 🍰 Desery | szt. | **brak** |
| Mini burgery wołowe | 🍢 Finger food | szt. | **brak** |
| Kiełbasa śląska z grilla | 🔥 Grill | os. | 24 zł |
| Kawa przelewowa premium | ☕ Przerwa kawowa | os. | 12 zł |
| Ziemniaki pieczone | 🥔 Dodatki | os. | 10 zł |

## Co jeszcze trzeba
Dwa dania (tarta, mini burgery) mają `unit_type = PIECE` ale `price_per_piece = NULL` — trzeba je uzupełnić migracją:

- `tarta-cytrynowa` → `price_per_piece = 14.00`
- `mini-burgery` → `price_per_piece = 18.00`

## Plik do zmiany
Nowa migracja SQL z dwoma UPDATE-ami na tabeli `dishes`.

