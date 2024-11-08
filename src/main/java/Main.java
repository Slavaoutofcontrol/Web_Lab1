import com.fastcgi.FCGIInterface;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Main {
    private static final String RESPONSE_TEMPLATE = "HTTP/1.1 200 OK\r\nContent-Type: application/json";
    private static final Logger logger = Logger.getLogger(Main.class.getName());

    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        logger.info("Starting FastCGI server...");

        while (fcgi.FCGIaccept() >= 0) {
            long startTime = System.currentTimeMillis();
            try {
                String body = readRequestBody();
                logger.info("Received request body: " + body);

                HashMap<String, String> params = parse(body);
                logger.info("Parsed parameters: " + params);

                if (!params.containsKey("x") || !params.containsKey("y") || !params.containsKey("r")) {
                    logger.warning("Missing necessary query parameters.");
                    sendJson("{\"error\": \"missed necessary query param\"}");
                    continue;
                }

                double x = Double.parseDouble(params.get("x"));
                double y = Double.parseDouble(params.get("y"));
                double r = Double.parseDouble(params.get("r"));

                logger.info(String.format("Parsed values - x: %f, y: %.2f, r: %f", x, y, r));

                if (validateX(x) && validateY(y) && validateR(r)) {
                    boolean isInside = hit(x, y, r);
                    long endTime = System.currentTimeMillis();
                    DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");

                    logger.info("Calculations result: " + isInside);
                    sendJson("{\"x\": " + x + ", " +
                            "\"y\": " + y + ", " +
                            "\"r\": " + r + ", " +
                            "\"currentTime\": \"" + dtf.format(java.time.LocalDateTime.now()) + "\", " +
                            "\"executionTime\": \"" + (endTime - startTime) + " ms\", " +
                            "\"result\": " + isInside + "}");
                } else {
                    logger.warning("Invalid data received.");
                    sendJson("{\"error\": \"invalid data\"}");
                }
            } catch (Exception e) {
                logger.log(Level.SEVERE, "An error occurred while processing the request.", e);
                sendJson(String.format("{\"error\": \"%s\"}", e.getMessage()));
            }
        }
    }

    private static String readRequestBody() throws IOException {
        try {
            FCGIInterface.request.inStream.fill();
            int contentLength = FCGIInterface.request.inStream.available();
            var buffer = ByteBuffer.allocate(contentLength);
            var readBytes = FCGIInterface.request.inStream.read(buffer.array(), 0, contentLength);
            var requestBodyRaw = new byte[readBytes];
            buffer.get(requestBodyRaw);
            buffer.clear();
            return new String(requestBodyRaw, StandardCharsets.UTF_8);
        } catch (NullPointerException e) {
            logger.warning("Request body is empty");
            return "";
        }
    }

    private static HashMap<String, String> parse(String queryString) {
        HashMap<String, String> map = new HashMap<>();

        if (queryString == null || queryString.isEmpty()) {
            logger.warning("Query string is null or empty.");
            return map;
        }

        queryString = queryString.substring(1, queryString.length() - 1); // удалить скобки
        String[] pairs = queryString.split(",");

        for (String pair : pairs) {
            String[] keyValue = pair.split(":");
            map.put(URLDecoder.decode(keyValue[0].replaceAll("\"", ""), StandardCharsets.UTF_8),
                    URLDecoder.decode(keyValue[1].replaceAll("\"", ""), StandardCharsets.UTF_8));
        }
        return map;
    }

    private static void sendJson(String jsonDump) {
        String content = RESPONSE_TEMPLATE + "Content-Length: " + jsonDump.getBytes(StandardCharsets.UTF_8).length + "\r\n\r\n" + jsonDump;
        logger.info("Sending response: " + content);
        //System.out.printf(response);
        try {
            FCGIInterface.request.outStream.write(content.getBytes(StandardCharsets.UTF_8));
            logger.info("Beep");
        } catch (IOException e) {
            logger.log(Level.SEVERE, "Failed to send response.", e);
        }
    }

    private static boolean hit(double x, double y, double r) {
        if (x > 0 && y < 0) {
            return false;
        } else if (x >= 0 && y >= 0) {
            return x <= r / 2 && y <= Math.sqrt((r * r) / 4 - x * x);
        } else if (x <= 0 && y <= 0) {
            return x <= r && Math.abs(y) <= r;
        } else {
            return Math.abs(x) <= r / 2 && y >= -x - r / 2;
        }
    }

    public static boolean validateX(double x) {
        return x >= -4 && x <= 4;
    }

    public static boolean validateY(double y) {
        return y >= -3 && y <= 3;
    }

    public static boolean validateR(double r) {
        return r >= 1 && r <= 5;
    }
}