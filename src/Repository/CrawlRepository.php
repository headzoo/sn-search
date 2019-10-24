<?php
namespace App\Repository;

use App\Entity\Crawl;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Symfony\Bridge\Doctrine\RegistryInterface;

/**
 * Class CrawlRepository
 */
class CrawlRepository extends ServiceEntityRepository
{
    /**
     * Constructor
     *
     * @param RegistryInterface $registry
     */
    public function __construct(RegistryInterface $registry)
    {
        parent::__construct($registry, Crawl::class);
    }

    /**
     * @param int $id
     *
     * @return object|Crawl
     */
    public function findByID($id)
    {
        return $this->findOneBy(['id' => $id]);
    }
}
