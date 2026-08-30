import Mangopay from 'mangopay4-nodejs-sdk';
import { env } from '../../config/env.js';
import { User } from '../../models/index.js';

// Mangopay's "Card Direct" flow is a 3-step dance that cannot be shortened:
//   1) Server creates a CardRegistration -> gets a tokenization URL + preregistration data.
//   2) Browser posts the raw card number *directly to Mangopay's tokenization server*
//      (never touching our backend — this is required for PCI scope reasons).
//   3) Server finalizes the CardRegistration with the returned token, then creates
//      a Direct PayIn using the resulting CardId.
// This is the real, documented Mangopay flow (not a shortcut we invented) — it's
// what makes Mangopay the "heaviest" of the three providers, as flagged in the plan.

let client;
function getClient() {
  if (!client) {
    client = new Mangopay({
      clientId: env.mangopay.clientId,
      clientApiKey: env.mangopay.apiKey,
      baseUrl: env.mangopay.baseUrl,
    });
  }
  return client;
}

export async function ensureMangopayUser(user) {
  if (user.mangopay?.userId) return user.mangopay.userId;

  const api = getClient();
  const mpUser = await api.Users.create({
    PersonType: 'NATURAL',
    FirstName: user.name.split(' ')[0] || user.name,
    LastName: user.name.split(' ').slice(1).join(' ') || user.name,
    Email: user.email,
  });

  await User.findByIdAndUpdate(user._id, { 'mangopay.userId': mpUser.Id });
  return mpUser.Id;
}

export async function ensureWallet(user, mpUserId, currency = 'EUR') {
  if (user.mangopay?.walletId) return user.mangopay.walletId;

  const api = getClient();
  const wallet = await api.Wallets.create({
    Owners: [mpUserId],
    Currency: currency,
    Description: 'Demo wallet',
  });

  await User.findByIdAndUpdate(user._id, { 'mangopay.walletId': wallet.Id });
  return wallet.Id;
}

export async function createCardRegistration(mpUserId, currency = 'EUR') {
  const api = getClient();
  return api.CardRegistrations.create({
    UserId: mpUserId,
    Currency: currency,
  });
}

export async function finalizeCardRegistration(registrationId, registrationData) {
  const api = getClient();
  return api.CardRegistrations.update({
    Id: registrationId,
    RegistrationData: registrationData,
  });
}

export async function createDirectPayIn({ mpUserId, walletId, cardId, amountMinor, currency }) {
  const api = getClient();
  return api.PayIns.create('CARD_DIRECT', {
    AuthorId: mpUserId,
    CreditedWalletId: walletId,
    CardId: cardId,
    DebitedFunds: { Amount: amountMinor, Currency: currency },
    Fees: { Amount: 0, Currency: currency },
    SecureMode: 'DEFAULT',
  });
}
