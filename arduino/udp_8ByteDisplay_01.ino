/*
 * UDPSendReceiveStrings
 * This sketch receives UDP message strings, prints them to the serial port
 * and sends an "acknowledge" string back to the sender
 * Use with Arduino 1.0
 *
 */

#include <SPI.h>         // needed for Arduino versions later than 0018
#include <Ethernet.h>
#include <EthernetUdp.h> // Arduino 1.0 UDP library

#include "LedControl.h"


byte mac[] = { 0x90, 0xA2, 0xDA, 0x0D, 0x1A, 0x37 }; // MAC address to use
IPAddress ip(10, 118, 73, 220);    // Arduino's IP address
unsigned int localPort = 8888;      // local port to listen on

// buffers for receiving and sending data
char packetBuffer[UDP_TX_PACKET_MAX_SIZE]; //buffer to hold incoming packet,
char replyBuffer[] = "acknowledged";       // a string to send back

// A UDP instance to let us send and receive packets over UDP
EthernetUDP Udp;

LedControl lc=LedControl(5,3,2,1);

void setup() {
    // start the Ethernet and UDP:
  Ethernet.begin(mac, ip);
  Udp.begin(localPort);
  
  
  lc.shutdown(0,false);
  /* Set the brightness to a medium values */
  lc.setIntensity(0,8);
  /* and clear the display */
  lc.clearDisplay(0);
  
  Serial.begin(9600);
}

void loop() {
  // if there's data available, read a packet
  int packetSize =  Udp.parsePacket(); 
  if(packetSize)
  {
    Serial.print("Received packet of size ");
    Serial.println(packetSize);

    // read packet into packetBuffer and get sender's IP addr and port number
    Udp.read(packetBuffer,UDP_TX_PACKET_MAX_SIZE);
    
//    Serial.println("Contents:");
//    Serial.println(packetBuffer);
    
    for (int i=0; i<packetSize; i++){
//      Serial.print(i);
//      Serial.print(": ");
//      Serial.println(packetBuffer[i], BIN);
      lc.setRow(0,i,packetBuffer[i]);
    }

    // send a string back to the sender
    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(replyBuffer);
    Udp.endPacket();
    memset( packetBuffer, 0, sizeof(packetBuffer) );
  }
//  delay(10);
}
