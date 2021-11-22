import {Address, BigInt, log} from '@graphprotocol/graph-ts';

import {CouponRedeemed} from './generated/CouponOnboarding/CouponOnboarding';
import {Coupon} from './generated/schema';

function loadOrCreateCoupon(
  daoAddress: Address,
  authorizedMember: Address,
  nonce: BigInt
): Coupon {
  // Set to `${daoAddress}-coupon-${nonce}-${authorizedMember}`
  let couponId = daoAddress
    .toHex()
    .concat('-coupon-')
    .concat(nonce.toString())
    .concat('-')
    .concat(authorizedMember.toHex());

  let coupon = Coupon.load(couponId);

  if (coupon == null) {
    coupon = new Coupon(couponId);
  }

  return coupon as Coupon;
}

export function handleCouponRedeemed(event: CouponRedeemed): void {
  log.info(
    '================ CouponRedeemed event fired. daoAddress: {}, authorizedMember: {}, amount: {}, nonce: {}',
    [
      event.params.daoAddress.toHexString(),
      event.params.authorizedMember.toHexString(),
      event.params.amount.toString(),
      event.params.nonce.toString(),
    ]
  );

  let coupon = loadOrCreateCoupon(
    event.params.daoAddress,
    event.params.authorizedMember,
    event.params.nonce
  );

  coupon.redeemedAt = event.block.timestamp.toString();
  coupon.authorizedMember = event.params.authorizedMember;
  coupon.amount = event.params.amount;
  coupon.nonce = event.params.nonce;

  coupon.save();
}
