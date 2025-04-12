df=100
df main():
  def funct1():
    df=101
    print("funct1",df)
    return df
  def funct2():
    df=102
    print("in funct2",df)
    return df
  df=funct2()
  print df
if __main__=="__main__":
  main()
