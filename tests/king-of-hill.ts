import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KingOfTheHill } from "../target/types/king_of_the_hill";

import { assert } from "chai";
// const web3 = require("@solana/web3.js");
import * as web3 from "@solana/web3.js";

describe("King of the hill tests", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.KingOfTheHill as Program<KingOfTheHill>;

  let initialKing, newKing;
  let gameStatePDA, prizePoolPDA;

  // utillity func for airdrop
  async function fundWallet(account, amount) {
    const publicKey = account.publicKey ? account.publicKey : account;

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(publicKey, amount),
      "confirmed",
    );
  }

  before(async () => {
    initialKing = web3.Keypair.generate();
    newKing = web3.Keypair.generate();

    await fundWallet(initialKing, 25 * web3.LAMPORTS_PER_SOL);
    await fundWallet(newKing, 30 * web3.LAMPORTS_PER_SOL);

    [gameStatePDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("game_state")],
      program.programId
    );

    [prizePoolPDA] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("prize_pool")],
      program.programId
    );
  });

  it("Initializes the game correctly", async () => {
    // arrange
    await fundWallet(gameStatePDA, 1 * web3.LAMPORTS_PER_SOL);
    await fundWallet(prizePoolPDA, 1 * web3.LAMPORTS_PER_SOL);

    let initialPrize = new anchor.BN(1 * web3.LAMPORTS_PER_SOL);

    // act
    const tx = await program.methods
      .initialize(initialPrize)
      .accounts({
        gameState: gameStatePDA,
        initialKing: initialKing.publicKey,
        prizePool: prizePoolPDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([initialKing])
      .rpc();

    // assert
    let gameState: any = await program.account.gameState.fetch(gameStatePDA);
    assert.equal(gameState.king.toBase58(), initialKing.publicKey.toBase58());
    assert.equal(
      gameState.prize.toString(),
      new anchor.BN(1 * web3.LAMPORTS_PER_SOL).toString()
    );
  });

  it("Changes the king correctly", async () => {
    // arrange
    const initialKingBalanceBefore = await provider.connection.getBalance(initialKing.publicKey);
    let newPrize = new anchor.BN(2 * web3.LAMPORTS_PER_SOL);

    // act
    const becomeKingTx = await program.methods.becomeKing(newPrize)
      .accounts({
        gameState: gameStatePDA,
        king: initialKing.publicKey,
        payer: newKing.publicKey,
        prizePool: prizePoolPDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([newKing])
      .rpc();

    // assert
    const initialKingBalanceAfter = await provider.connection.getBalance(initialKing.publicKey);

    const expectedBalance = initialKingBalanceBefore + new anchor.BN(1 * web3.LAMPORTS_PER_SOL).toNumber();
    assert.ok(initialKingBalanceAfter >= expectedBalance, "old king did not receive the funcs back");

    // fetch the updated game state
    const updatedGameState = await program.account.gameState.fetch(gameStatePDA);

    // assertion to confirm the state has updated as expected.
    assert.equal(updatedGameState.king.toBase58(), newKing.publicKey.toBase58(), "king should be updated to new king")
    assert.equal(updatedGameState.prize.toString(), newPrize.toString(), "prize should be updated to new prize");
  });
});
