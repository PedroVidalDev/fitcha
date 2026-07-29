package com.pedro.fitchaadmin.machine.services;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Base64;
import java.util.Locale;
import java.util.Set;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MachineImageService {
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif"
    );

    public String toDataUri(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return null;
        }

        if (image.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new IllegalArgumentException("A imagem deve ter no máximo 5 MB.");
        }

        String contentType = image.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("Não foi possível identificar o tipo da imagem.");
        }

        contentType = contentType.toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(contentType)) {
            contentType = "image/jpeg";
        }

        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Envie uma imagem PNG, JPEG ou GIF.");
        }

        try {
            BufferedImage decodedImage = ImageIO.read(image.getInputStream());
            if (decodedImage == null) {
                throw new IllegalArgumentException("O arquivo enviado não é uma imagem válida.");
            }

            return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(image.getBytes());
        } catch (IOException exception) {
            throw new IllegalArgumentException("Não foi possível ler a imagem enviada.", exception);
        }
    }
}
