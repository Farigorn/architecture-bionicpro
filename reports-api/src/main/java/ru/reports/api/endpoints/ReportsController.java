package ru.reports.api.endpoints;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.reports.api.response.ProstheticReportResponse;
import ru.reports.api.service.ReportService;

import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/reports")
@Tag(name = "Reports", description = "Отчёты по работе бионического протеза")
public class ReportsController {

    private static final String CSV_DELIMITER = ";";
    private static final String UTF_8_BOM = "\uFEFF";

    private  final ReportService reportService;

    public ReportsController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    @Operation(
            summary = "Скачать CSV-отчёт текущего пользователя за период",
            security = @SecurityRequirement(name = "keycloak-oauth2")
    )
    public ResponseEntity<String> getMyReports(
            JwtAuthenticationToken authentication,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to
    ) {
        String userId = authentication.getToken().getClaimAsString("preferred_username");
        List<ProstheticReportResponse> reports = reportService.getReportsForUser(userId, from, to);
        String filename = "prosthetic-report-%s-%s.csv".formatted(from, to);

        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"%s\"".formatted(filename))
                .body(toCsv(reports));
    }

    private String toCsv(List<ProstheticReportResponse> reports) {
        String header = "user_id;prosthetic_id;report_date;user_full_name;prosthetic_model;serial_number;total_events;avg_response_time_ms;max_response_time_ms;avg_sensor_noise;low_battery_events;last_telemetry_at;updated_at";

        String rows = reports.stream()
                .map(this::toCsvRow)
                .collect(Collectors.joining("\n"));

        return rows.isEmpty() ? UTF_8_BOM + header + "\n" : UTF_8_BOM + header + "\n" + rows + "\n";
    }

    private String toCsvRow(ProstheticReportResponse report) {
        return Stream.of(
                        report.userId(),
                        report.prostheticId(),
                        report.reportDate(),
                        report.userFullName(),
                        report.prostheticModel(),
                        report.serialNumber(),
                        report.totalEvents(),
                        report.avgResponseTimeMs(),
                        report.maxResponseTimeMs(),
                        report.avgSensorNoise(),
                        report.lowBatteryEvents(),
                        report.lastTelemetryAt(),
                        report.updatedAt()
                )
                .map(value -> escapeCsv(String.valueOf(value)))
                .collect(Collectors.joining(CSV_DELIMITER));
    }

    private String escapeCsv(String value) {
        if (value.contains(CSV_DELIMITER) || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }

        return value;
    }
}
