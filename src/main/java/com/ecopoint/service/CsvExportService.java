package com.ecopoint.service;

import com.ecopoint.entity.WasteDeposit;
import com.ecopoint.entity.WalletTransaction;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class CsvExportService {

    public byte[] exportDepositsToCsv(List<WasteDeposit> deposits) {
        StringBuilder sb = new StringBuilder();
        // RFC 4180 header
        sb.append("Deposit Code,User Name,User Email,Bag Code,Category,Estimated Weight (kg),Actual Weight (kg),Status,Points Awarded,Processing Outcome,Created At,Verified At\n");

        for (WasteDeposit d : deposits) {
            sb.append(escapeCsv(d.getDepositCode())).append(",");
            sb.append(escapeCsv(d.getUser() != null ? d.getUser().getFullName() : "N/A")).append(",");
            sb.append(escapeCsv(d.getUser() != null ? d.getUser().getEmail() : "N/A")).append(",");
            sb.append(escapeCsv(d.getBag() != null ? d.getBag().getBagCode() : "N/A")).append(",");
            String catName = d.getActualCategory() != null ? d.getActualCategory().getName() : (d.getInitialCategory() != null ? d.getInitialCategory().getName() : "UNSPECIFIED");
            sb.append(escapeCsv(catName)).append(",");
            sb.append(d.getEstimatedWeight() != null ? d.getEstimatedWeight() : "").append(",");
            sb.append(d.getActualWeight() != null ? d.getActualWeight() : "").append(",");
            sb.append(escapeCsv(d.getStatus() != null ? d.getStatus().name() : "")).append(",");
            sb.append(d.getPointsAwarded() != null ? d.getPointsAwarded() : 0).append(",");
            String outcome = d.getProcessingOutcome() != null ? d.getProcessingOutcome().name() : "PENDING";
            sb.append(escapeCsv(outcome)).append(",");
            sb.append(escapeCsv(d.getCreatedAt() != null ? d.getCreatedAt().toString() : "")).append(",");
            sb.append(d.getVerifiedAt() != null ? escapeCsv(d.getVerifiedAt().toString()) : "");
            sb.append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportLedgerToCsv(List<WalletTransaction> transactions) {
        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,User Name,User Email,Transaction Type,Points,Balance After,Description,Timestamp\n");

        for (WalletTransaction tx : transactions) {
            sb.append(tx.getId() != null ? tx.getId() : "").append(",");
            String userName = (tx.getWallet() != null && tx.getWallet().getUser() != null) ? tx.getWallet().getUser().getFullName() : "System / Unknown";
            String userEmail = (tx.getWallet() != null && tx.getWallet().getUser() != null) ? tx.getWallet().getUser().getEmail() : "N/A";
            sb.append(escapeCsv(userName)).append(",");
            sb.append(escapeCsv(userEmail)).append(",");
            sb.append(escapeCsv(tx.getType() != null ? tx.getType().name() : "")).append(",");
            sb.append(tx.getPoints()).append(",");
            sb.append(tx.getBalanceAfter()).append(",");
            sb.append(escapeCsv(tx.getDescription() != null ? tx.getDescription() : "")).append(",");
            sb.append(escapeCsv(tx.getTimestamp() != null ? tx.getTimestamp().toString() : ""));
            sb.append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) {
            return "";
        }
        if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
