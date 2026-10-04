// @policy VendorRiskReview
int contractValue;
int riskScore;
int yearsKnown;
float approvalLimit;
int reviewFlag;

if (contractValue <= 250000 && riskScore <= 35 && yearsKnown >= 2) {
  approve();
  approvalLimit = contractValue + 50000;
  reviewFlag = 0;
} else {
  review();
  approvalLimit = 50000;
  reviewFlag = 1;
}
