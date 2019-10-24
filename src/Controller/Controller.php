<?php
namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use FOS\ElasticaBundle\Index\IndexManager;
use Redis;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;

/**
 * Class Controller
 */
class Controller extends AbstractController
{
    /**
     * @var EntityManagerInterface
     */
    protected $em;

    /**
     * @var EventDispatcherInterface
     */
    protected $eventDispatcher;

    /**
     * @var Redis
     */
    protected $redis;

    /**
     * @var IndexManager
     */
    protected $indexManager;

    /**
     * Constructor
     *
     * @param EntityManagerInterface   $em
     * @param EventDispatcherInterface $eventDispatcher
     * @param Redis                    $redis
     * @param IndexManager             $indexManager
     */
    public function __construct(
        EntityManagerInterface $em,
        EventDispatcherInterface $eventDispatcher,
        Redis $redis,
        IndexManager $indexManager
    )
    {
        $this->em              = $em;
        $this->redis           = $redis;
        $this->indexManager    = $indexManager;
        $this->eventDispatcher = $eventDispatcher;
    }
}
