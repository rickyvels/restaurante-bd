#include <fstream>
#include <iostream>

int main() {
    std::ofstream archivo("mi_primer_archivo.txt");

    if (!archivo) {
        std::cerr << "Error: no se pudo crear el archivo\n";
        return 1;
    }

    archivo << "Hola, soy un archivo creado desde C++\n";
    archivo << "Mi nombre es: Rick\n";
    archivo << "Mi numero favorito es: " << 42 << "\n";

    std::cout << "Archivo creado exitosamente!\n";
    return 0;
}
