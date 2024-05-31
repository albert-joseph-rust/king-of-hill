### King of the Hill

This program implements a simple “King of the Hill” game on Solana. The game allows users to become the “king” by sending more SOL to the prize pool than the current king did. The SOL sent by the previous king is transferred back to them when a new king takes their place.

#### The program’s functionality is as follows:

**Initialize**: This function sets up the game with an initial king (i.e., the first player to initialize the game) and an initial prize amount. The initial prize must be greater than zero. The function then transfers the initial prize from the initial king to a prize pool
**Become King**: This function allows a new player to become a king by bidding more SOL than the current prize. It transfers the current prize to the outgoing king and updates the prize pool with the new king’s bid, making them the new king. This bid must be higher than the current prize