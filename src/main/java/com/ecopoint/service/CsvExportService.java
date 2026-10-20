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
            sb.append(escapeCsv(d.getUser().getFullName())).append(",");
            sb.append(escapeCsv(d.getUser().getEmail())).append(",");
            sb.append(escapeCsv(d.getBag().getBagCode())).append(",");
            sb.append(escapeCsv(d.getActualCategory() != null ? d.getActualCategory().getName() : d.getInitialCategory().getName())).append(",");
            sb.append(d.getEstimatedWeight() != null ? d.getEstimatedWeight() : "").append(",");
            sb.append(d.getActualWeight() != null ? d.getActualWeight() : "").append(",");
            sb.append(escapeCsv(d.getStatus().name())).append(",");
            sb.append(d.getPointsAwarded() != null ? d.getPointsAwarded() : 0).append(",");
            sb.append(escapeCsv(d.getProcessingOutcome().name())).append(",");
            sb.append(escapeCsv(d.getCreatedAt().toString())).append(",");
            sb.append(d.getVerifiedAt() != null ? escapeCsv(d.getVerifiedAt().toString()) : "");
            sb.append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportLedgerToCsv(List<WalletTransaction> transactions) {
        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,User Name,User Email,Transaction Type,Points,Balance After,Description,Timestamp\n");

        for (WalletTransaction tx : transactions) {
            sb.append(tx.getId()).append(",");
            sb.append(escapeCsv(tx.getWallet().getUser().getFullName())).append(",");
            sb.append(escapeCsv(tx.getWallet().getUser().getEmail())).append(",");
            sb.append(escapeCsv(tx.getType().name())).append(",");
            sb.append(tx.getPoints()).append(",");
            sb.append(tx.getBalanceAfter()).append(",");
            sb.append(escapeCsv(tx.getDescription())).append(",");
            sb.append(escapeCsv(tx.getTimestamp().toString()));
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
