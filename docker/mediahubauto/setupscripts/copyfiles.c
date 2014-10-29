#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <unistd.h>
#include <string.h>

#define BUFSIZE 100000
int copyfile(const char* from, const char *to) {
  FILE *in, *out;
  char buf[BUFSIZE];
  in = fopen(from, "r");
  if (in==NULL) {
    printf("Could not open %s to read", from);
    return -1;
  }
  out = fopen(to, "w"); 
  if (out==NULL) {
    printf("Could not open %s to write", to);
    return -1;
  }
  while (1) {
    int cnt = fread(buf, 1, BUFSIZE, in);
    if (cnt<=0)
      break;
    fwrite(buf, 1, cnt, out);
  }
  fclose(in);
  fclose(out);
  chmod(to, 0644);
  return 0;
}

int main(int argc, const char*argv[]) {
  char *buf;
  int len;
  int res;
  /*setuid(0);*/
  printf("as %d\n", geteuid());
  if (argc!=4) {
    printf("Usage: f1 f2 f3");
    return -1;
  }
  if (copyfile(argv[1], "/home/root/opensharingtoolkit-mediahub/instance")!=0 ||
      copyfile(argv[2], "/etc/nginx/conf/htpasswd")!=0 || 
      copyfile(argv[3], "/etc/nginx/sites-available/default")!=0) 
    return -1;
  printf("signal nginx");
  res = system("nginx -s reload");
  printf("signal nginx = %d", res);
  return res;
}

